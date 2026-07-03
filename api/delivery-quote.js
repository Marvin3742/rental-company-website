// POST /api/delivery-quote { street, city, state, zip } → { serviceable, feeCents, miles, reason? }
// Lets the checkout show the delivery fee before payment.
import { withApi, HttpError } from "../lib/server/http.js";
import { quoteDelivery } from "../lib/server/delivery.js";

export default withApi({
  async POST(req) {
    const { street, city, state, zip } = req.body ?? {};
    if (!street || !city || !state || !zip) {
      throw new HttpError(400, "street, city, state, and zip are required");
    }
    const q = await quoteDelivery({ street, city, state, zip });
    // Don't expose distance to the customer — only the fee/serviceability.
    return { serviceable: q.serviceable, feeCents: q.feeCents, reason: q.reason };
  },
});
