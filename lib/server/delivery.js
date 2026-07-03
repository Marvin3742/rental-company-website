// Tiered delivery fee by straight-line distance from the shop.
// Geocoding uses the free US Census service (no API key). Distance is haversine
// (a "radius"), matching how the tiers are defined.

// Shop origin: 931 San Remo Ave, Naples, FL 34104 (geocoded via US Census).
const ORIGIN = {
  lat: Number(process.env.DELIVERY_ORIGIN_LAT ?? 26.144767),
  lng: Number(process.env.DELIVERY_ORIGIN_LNG ?? -81.76227),
};

// Ascending tiers: an address within maxMiles pays feeCents. Beyond the last
// tier is not serviceable online.
export const DELIVERY_TIERS = [
  { maxMiles: 10, feeCents: 0 },
  { maxMiles: 25, feeCents: 3000 },
  { maxMiles: 50, feeCents: 6000 },
];
const MAX_MILES = DELIVERY_TIERS[DELIVERY_TIERS.length - 1].maxMiles;

function haversineMiles(a, b) {
  const R = 3958.7613; // Earth radius, miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Build a clean single-line query (no unit/notes) for geocoding. */
function geocodeQuery({ street, city, state, zip }) {
  return [street, city, state, zip].filter(Boolean).join(", ");
}

async function geocode(parts) {
  const url =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress" +
    `?address=${encodeURIComponent(geocodeQuery(parts))}` +
    "&benchmark=Public_AR_Current&format=json";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const match = data?.result?.addressMatches?.[0];
    if (!match) return null;
    return { lat: Number(match.coordinates.y), lng: Number(match.coordinates.x) };
  } catch {
    return null;
  }
}

/**
 * Quote delivery for a structured address.
 * @returns { serviceable, feeCents, miles, reason? }
 *   reason: "unverified" (couldn't geocode) | "too_far" (> max tier)
 */
export async function quoteDelivery(parts) {
  const geo = await geocode(parts);
  if (!geo) return { serviceable: false, reason: "unverified", feeCents: 0, miles: null };

  const miles = haversineMiles(ORIGIN, geo);
  if (miles > MAX_MILES) {
    return { serviceable: false, reason: "too_far", feeCents: 0, miles: Math.round(miles) };
  }
  const tier = DELIVERY_TIERS.find((t) => miles <= t.maxMiles);
  return { serviceable: true, feeCents: tier.feeCents, miles: Math.round(miles * 10) / 10 };
}
