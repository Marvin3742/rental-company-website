// GET /api/bookings/:id — booking status for the success page to poll.
// The id is an unguessable cuid, so it's safe to expose this summary by id.
import { withApi, HttpError } from "../../lib/server/http.js";
import { prisma } from "../../lib/server/prisma.js";

export default withApi({
  async GET(req) {
    const id = req.query?.id;
    if (!id) throw new HttpError(400, "Missing booking id");

    const b = await prisma.booking.findUnique({ where: { id } });
    if (!b) throw new HttpError(404, "Booking not found");

    return {
      id: b.id,
      status: b.status,
      eventDate: b.eventDate.toISOString().slice(0, 10),
      customerName: b.customerName,
      paymentMode: b.paymentMode,
      subtotalCents: b.subtotalCents,
      taxCents: b.taxCents,
      deliveryFeeCents: b.deliveryFeeCents,
      totalCents: b.totalCents,
      amountPaidCents: b.amountPaidCents,
      balanceDueCents: b.balanceDueCents,
    };
  },
});
