// Client helpers for the availability API.

/** Check a cart against a specific event date. Returns per-line availability + bookable. */
export async function checkCartAvailability(eventDate, items) {
  const lines = items.map((i) => ({ kind: i.kind, slug: i.slug, quantity: i.quantity }));
  const res = await fetch("/api/availability", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventDate, lines }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Availability check failed (${res.status})`);
  }
  return res.json();
}

/** Today's date as "YYYY-MM-DD" in the user's local timezone. */
export function todayISO() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

/** A Date (local) → "YYYY-MM-DD". */
export function toISODate(date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

/** Format "YYYY-MM-DD" as a friendly label, e.g. "Tuesday, June 30, 2026". */
export function formatDateLong(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
