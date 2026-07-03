// GET  /api/admin/bookings?status=&from=&to=   → list bookings
// PATCH /api/admin/bookings { id, action, ... }  → confirmTimes | cancel | recordBalance | complete | saveNote
import { withApi, HttpError } from "../../lib/server/http.js";
import { prisma } from "../../lib/server/prisma.js";
import { requireAdmin } from "../../lib/server/auth.js";

function serialize(b) {
  return {
    id: b.id,
    status: b.status,
    eventDate: b.eventDate.toISOString().slice(0, 10),
    createdAt: b.createdAt.toISOString(),
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    deliveryAddress: b.deliveryAddress,
    deliveryStreet: b.deliveryStreet,
    deliveryUnit: b.deliveryUnit,
    deliveryCity: b.deliveryCity,
    deliveryState: b.deliveryState,
    deliveryZip: b.deliveryZip,
    deliveryNotes: b.deliveryNotes,
    dropoffLatestTime: b.dropoffLatestTime,
    pickupEarliestTime: b.pickupEarliestTime,
    pickupSameDay: b.pickupSameDay,
    timesConfirmed: b.timesConfirmed,
    paymentMode: b.paymentMode,
    subtotalCents: b.subtotalCents,
    taxCents: b.taxCents,
    deliveryFeeCents: b.deliveryFeeCents,
    totalCents: b.totalCents,
    amountPaidCents: b.amountPaidCents,
    balanceDueCents: b.balanceDueCents,
    balanceCollectedMethod: b.balanceCollectedMethod,
    adminNote: b.adminNote,
    lines: (b.lines ?? []).map((l) => ({
      name: l.product?.name ?? l.package?.name ?? l.lineType,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
    })),
  };
}

const withLines = { include: { product: true, package: true } };

export default withApi({
  async GET(req) {
    requireAdmin(req);
    const { status, from, to, city, ref } = req.query ?? {};
    const where = {};
    if (ref && ref.trim()) {
      // Reference search jumps straight to a specific order — ignore other filters.
      where.id = { contains: ref.trim() };
    } else {
      if (status) where.status = status;
      if (city) where.deliveryCity = { contains: city, mode: "insensitive" };
      if (from || to) {
        where.eventDate = {};
        if (from) where.eventDate.gte = new Date(`${from}T00:00:00.000Z`);
        if (to) where.eventDate.lte = new Date(`${to}T00:00:00.000Z`);
      }
    }
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: [{ eventDate: "asc" }, { createdAt: "desc" }],
      include: { lines: withLines },
      take: 500,
    });
    return bookings.map(serialize);
  },

  async PATCH(req) {
    requireAdmin(req);
    const { id, action } = req.body ?? {};
    if (!id || !action) throw new HttpError(400, "id and action are required");

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new HttpError(404, "Booking not found");

    switch (action) {
      case "cancel":
        await prisma.$transaction([
          prisma.booking.update({ where: { id }, data: { status: "CANCELLED", holdExpiresAt: null } }),
          prisma.reservation.updateMany({
            where: { bookingId: id },
            data: { status: "RELEASED", expiresAt: null },
          }),
        ]);
        break;

      case "complete":
        await prisma.booking.update({ where: { id }, data: { status: "COMPLETED" } });
        break;

      case "confirmTimes": {
        const { dropoffLatestTime, pickupEarliestTime, pickupSameDay } = req.body;
        await prisma.booking.update({
          where: { id },
          data: {
            dropoffLatestTime: dropoffLatestTime ?? booking.dropoffLatestTime,
            pickupEarliestTime: pickupEarliestTime ?? booking.pickupEarliestTime,
            pickupSameDay: pickupSameDay ?? booking.pickupSameDay,
            timesConfirmed: true,
          },
        });
        break;
      }

      case "recordBalance": {
        const { method } = req.body;
        await prisma.booking.update({
          where: { id },
          data: { balanceDueCents: 0, balanceCollectedMethod: method || "other" },
        });
        break;
      }

      case "saveNote": {
        const { note } = req.body;
        const trimmed = typeof note === "string" ? note.trim() : "";
        await prisma.booking.update({
          where: { id },
          data: { adminNote: trimmed || null },
        });
        break;
      }

      default:
        throw new HttpError(400, `Unknown action "${action}"`);
    }

    const updated = await prisma.booking.findUnique({ where: { id }, include: { lines: withLines } });
    return serialize(updated);
  },
});
