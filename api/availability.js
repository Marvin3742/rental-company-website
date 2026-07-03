// POST /api/availability { eventDate, lines } → client-safe availability for a cart.
// Deliberately omits stock/available counts so customers can't see our inventory levels.
import { withApi } from "../lib/server/http.js";
import { checkAvailability, parseEventDate } from "../lib/server/availability.js";

export default withApi({
  async POST(req) {
    const { eventDate, lines } = req.body ?? {};
    const result = await checkAvailability({ eventDate: parseEventDate(eventDate), lines });
    return {
      date: result.date,
      bookable: result.bookable,
      dayBookable: result.dayBookable,
      globalBlackout: result.globalBlackout,
      lines: result.lines.map((l) => ({
        slug: l.slug,
        name: l.name,
        requested: l.requested,
        ok: l.ok,
      })),
    };
  },
});
