// POST /api/discount-quote { code, subtotalCents, deliveryFeeCents } → { valid, discountCents, kind, value } | { valid:false, reason }
// Read-only preview for the checkout page's "Apply" button — does not claim the code.
import { withApi, HttpError } from "../lib/server/http.js";
import { previewDiscount } from "../lib/server/discounts.js";
import { rateLimit, clientIp } from "../lib/server/rate-limit.js";

export default withApi({
  async POST(req) {
    // Slow down discount-code guessing; a real customer clicks Apply a few times.
    rateLimit(`discount-quote:${clientIp(req)}`, { max: 20, windowMs: 10 * 60 * 1000 });

    const { code, subtotalCents, deliveryFeeCents } = req.body ?? {};
    if (!code || !String(code).trim()) throw new HttpError(400, "code is required");
    const subtotal = Number(subtotalCents);
    const fee = Number(deliveryFeeCents) || 0;
    if (!Number.isInteger(subtotal) || subtotal < 0) throw new HttpError(400, "Invalid subtotalCents");

    return previewDiscount(code, subtotal + fee);
  },
});
