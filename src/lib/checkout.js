// Client helpers for the checkout + booking endpoints.

/** Start checkout: create the hold + Stripe session. Returns { url, bookingId }. */
export async function startCheckout(payload) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Checkout failed");
    err.status = res.status;
    err.shortfalls = data.shortfalls;
    throw err;
  }
  return data;
}

/** Public settings used to display deposit / delivery amounts. */
export async function fetchSettings() {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Could not load settings");
  return res.json();
}

/** Quote the delivery fee for a structured address. */
export async function fetchDeliveryQuote(parts) {
  const res = await fetch("/api/delivery-quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parts),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Delivery quote failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Booking status (for the success page to poll until CONFIRMED). */
export async function fetchBooking(id) {
  const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Could not load booking");
  return res.json();
}
