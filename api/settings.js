// GET /api/settings — public subset used by the checkout UI to display amounts.
import { withApi } from "../lib/server/http.js";
import { getSettings } from "../lib/server/availability.js";

export default withApi({
  async GET() {
    const s = await getSettings();
    return { depositPct: s.depositPct, deliveryFeeCents: s.deliveryFeeCents };
  },
});
