// Small-order fee: an order whose rentals subtotal (products + packages, before
// delivery and before any discount code) is under the threshold pays a flat fee,
// on top of any delivery fee. Shared by the server (what's charged) and the
// cart/checkout (what's shown), so the two can't disagree.

/** Same defaults as the Setting columns: $25 on orders under $50. */
export const SMALL_ORDER_DEFAULTS = { smallOrderThresholdCents: 5000, smallOrderFeeCents: 2500 };

/**
 * @param subtotalCents rentals subtotal (pre-delivery, pre-discount)
 * @param settings { smallOrderThresholdCents, smallOrderFeeCents } — a fee of 0
 *   turns it off; missing settings (not loaded yet) mean no fee
 * @returns the fee in cents (0 when it doesn't apply)
 */
export function computeSmallOrderFee(subtotalCents, settings) {
  const fee = settings?.smallOrderFeeCents ?? 0;
  const threshold = settings?.smallOrderThresholdCents ?? 0;
  return fee > 0 && subtotalCents < threshold ? fee : 0;
}
