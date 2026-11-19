// Google Analytics 4 + Google Ads tracking. gtag.js is loaded once, for GA4, in
// index.html; Google Ads rides on that same tag. Everything here is a silent
// no-op when gtag or the Ads settings are missing, and nothing here may ever
// throw into the app — tracking must never break checkout or navigation.
//
// Ads settings (Vite env, baked in at build time; leave unset to turn Ads off):
//   VITE_GOOGLE_ADS_ID             e.g. AW-123456789
//   VITE_GOOGLE_ADS_BOOKING_LABEL  "Online booking" conversion label
//   VITE_GOOGLE_ADS_CALL_LABEL     "Phone number click" conversion label

const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || "";
const BOOKING_LABEL = import.meta.env.VITE_GOOGLE_ADS_BOOKING_LABEL || "";
const CALL_LABEL = import.meta.env.VITE_GOOGLE_ADS_CALL_LABEL || "";

const CLICK_ID_KEY = "solimar_click_id"; // { type, value, ts } from the ad's landing URL
const CLICK_ID_TYPES = ["gclid", "gbraid", "wbraid"];
const CLICK_ID_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const ENHANCED_KEY = "solimar_ec"; // email/phone for enhanced conversions, sessionStorage only
const conversionKey = (bookingId) => `solimar_conv_${bookingId}`;

function gtag(...args) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag(...args);
  } catch {
    /* tracking must never break the site */
  }
}

// Storage can be missing or throw (private mode, blocked site data) — treat that as empty.
function getItem(area, key) {
  try {
    return window[area].getItem(key);
  } catch {
    return null;
  }
}
function setItem(area, key, value) {
  try {
    window[area].setItem(key, value);
  } catch {
    /* ignore */
  }
}
function removeItem(area, key) {
  try {
    window[area].removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Generic GA4 event. */
export function trackEvent(name, params = {}) {
  gtag("event", name, params);
}

let initialized = false;

/** Once, at app start: configure Google Ads, keep an ad click id, watch phone links. */
export function initAds() {
  if (initialized) return;
  initialized = true;
  try {
    if (ADS_ID) gtag("config", ADS_ID, { allow_enhanced_conversions: true });
    saveClickId(window.location.search);
    // One delegated listener covers every tel: link, current and future. It
    // never calls preventDefault, so the dialer opens as usual.
    document.addEventListener("click", onDocumentClick, true);
  } catch {
    /* ignore */
  }
}

function onDocumentClick(event) {
  try {
    const link = event.target?.closest?.('a[href^="tel:"]');
    if (link) trackPhoneClick(link.dataset.trackLocation || "other");
  } catch {
    /* ignore */
  }
}

/** A phone link was tapped. location: header | footer | cta | about | other. */
export function trackPhoneClick(location) {
  trackEvent("phone_click", { link_location: location });
  if (ADS_ID && CALL_LABEL) gtag("event", "conversion", { send_to: `${ADS_ID}/${CALL_LABEL}` });
}

// ─── Ad click id (gclid / gbraid / wbraid) ──────────────────────────────────

function saveClickId(search) {
  const params = new URLSearchParams(search);
  for (const type of CLICK_ID_TYPES) {
    const value = params.get(type);
    if (value) {
      setItem("localStorage", CLICK_ID_KEY, JSON.stringify({ type, value, ts: Date.now() }));
      return;
    }
  }
}

/** The ad click that brought this visitor in, if within 90 days: { type, value } or undefined. */
export function getClickId() {
  try {
    const saved = JSON.parse(getItem("localStorage", CLICK_ID_KEY) || "null");
    if (!saved?.value || !CLICK_ID_TYPES.includes(saved.type)) return undefined;
    if (!(Date.now() - saved.ts < CLICK_ID_MAX_AGE_MS)) {
      removeItem("localStorage", CLICK_ID_KEY);
      return undefined;
    }
    return { type: saved.type, value: saved.value };
  } catch {
    return undefined;
  }
}

// ─── Funnel events (GA4 only) ───────────────────────────────────────────────

const toItem = (i) => ({ item_id: i.slug, item_name: i.name, price: i.unitPriceCents / 100, quantity: i.quantity });

/** entry: a cart entry ({ slug, name, unitPriceCents }). */
export function trackAddToCart(entry, quantity) {
  try {
    trackEvent("add_to_cart", {
      currency: "USD",
      value: (entry.unitPriceCents * quantity) / 100,
      items: [toItem({ ...entry, quantity })],
    });
  } catch {
    /* ignore */
  }
}

/** items: cart entries; subtotalCents: the cart subtotal. */
export function trackBeginCheckout(items, subtotalCents) {
  try {
    trackEvent("begin_checkout", { currency: "USD", value: subtotalCents / 100, items: items.map(toItem) });
  } catch {
    /* ignore */
  }
}

// ─── Booking conversion ─────────────────────────────────────────────────────

/**
 * Just before leaving checkout: keep the customer's email and phone in this
 * tab's sessionStorage so the success page can send them, hashed by gtag, as
 * enhanced-conversion data. Only while an Ads booking conversion is set up.
 */
export function rememberCustomerForConversion({ email, phone }) {
  if (!ADS_ID || !BOOKING_LABEL) return;
  try {
    const data = {};
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    if (cleanEmail) data.email = cleanEmail;
    const digits = String(phone ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
    if (digits.length === 10) data.phone_number = `+1${digits}`;
    setItem("sessionStorage", ENHANCED_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

// RESERVE is stored as DEPOSIT with nothing paid (see createBookingHold).
const paymentType = (b) => (b.paymentMode === "FULL" ? "FULL" : b.amountPaidCents > 0 ? "DEPOSIT" : "RESERVE");

const firedThisPage = new Set(); // fallback when localStorage is unavailable

/**
 * The booking is confirmed (UPCOMING): report it to GA4 (purchase) and Google
 * Ads (conversion), once. booking: the GET /api/bookings/:id response.
 */
export function trackBooking(booking) {
  try {
    if (!booking?.id || firedThisPage.has(booking.id)) return;
    firedThisPage.add(booking.id);
    if (getItem("localStorage", conversionKey(booking.id))) return; // refresh / revisit

    const value = booking.totalCents / 100; // rentals + delivery + small-order fee − discount
    gtag("event", "purchase", {
      transaction_id: booking.id,
      value,
      currency: "USD",
      items: (booking.lines ?? []).map(toItem),
      payment_type: paymentType(booking),
    });
    if (ADS_ID && BOOKING_LABEL) {
      const userData = JSON.parse(getItem("sessionStorage", ENHANCED_KEY) || "null");
      if (userData && Object.keys(userData).length > 0) gtag("set", "user_data", userData);
      gtag("event", "conversion", {
        send_to: `${ADS_ID}/${BOOKING_LABEL}`,
        value,
        currency: "USD",
        transaction_id: booking.id,
      });
    }
    setItem("localStorage", conversionKey(booking.id), "1");
  } catch {
    /* ignore */
  } finally {
    removeItem("sessionStorage", ENHANCED_KEY);
  }
}
