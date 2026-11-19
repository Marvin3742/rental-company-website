// GET /api/bookings/:id — booking status for the success page to poll, plus what
// it needs to report the conversion (total, items, payment mode).
// The id is an unguessable cuid, so it's safe to expose this summary by id. No
// contact details (email, phone, address) — this endpoint is public.
import { withApi, HttpError } from "../../lib/server/http.js";
import { prisma } from "../../lib/server/prisma.js";

export default withApi({
  async GET(req) {
    const id = req.query?.id;
    if (!id) throw new HttpError(400, "Missing booking id");

    const b = await prisma.booking.findUnique({
      where: { id },
      include: { lines: { include: { product: true, package: true } } },
    });
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
      smallOrderFeeCents: b.smallOrderFeeCents,
      discountCents: b.discountCents,
      totalCents: b.totalCents,
      amountPaidCents: b.amountPaidCents,
      balanceDueCents: b.balanceDueCents,
      // What the customer bought: products and whole packages (not the
      // package-component rows, which only drive reservations).
      lines: b.lines
        .filter((l) => l.lineType !== "PACKAGE_COMPONENT")
        .map((l) => ({
          slug: l.product?.slug ?? l.package?.slug ?? null,
          name: l.product?.name ?? l.package?.name ?? null,
          unitPriceCents: l.unitPriceCents,
          quantity: l.quantity,
        })),
    };
  },
});
