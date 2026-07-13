// GET  /api/admin/bookings?status=&from=&to=&source=   → list bookings
// PATCH /api/admin/bookings { id, action, ... }  → confirmTimes | cancel | recordBalance | complete | saveNote
// POST /api/admin/bookings { eventDate, lines, customer, delivery, ... }  → record a manual booking
import { withApi, HttpError } from "../http.js";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../auth.js";
import { parseEventDate } from "../availability.js";
import { createManualBooking } from "../booking.js";
import { releaseDiscountCode } from "../discounts.js";
import { sendCustomerConfirmation } from "../email.js";

function serialize(b) {
  return {
    id: b.id,
    status: b.status,
    source: b.source,
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
    paymentMethod: b.paymentMethod,
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
    const { status, from, to, city, ref, source } = req.query ?? {};
    const where = {};
    if (ref && ref.trim()) {
      // Reference search jumps straight to a specific order — ignore other filters.
      where.id = { contains: ref.trim() };
    } else {
      if (status) where.status = status;
      if (source) where.source = source;
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
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({ where: { id }, data: { status: "CANCELLED", holdExpiresAt: null } });
          await tx.reservation.updateMany({
            where: { bookingId: id },
            data: { status: "RELEASED", expiresAt: null },
          });
          await releaseDiscountCode(id, tx);
        });
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

      case "sendConfirmation": {
        // Re-send the customer confirmation email (e.g. manual bookings, which
        // never auto-email, or a WEB booking whose webhook delivery failed).
        const full = await prisma.booking.findUnique({
          where: { id },
          include: { lines: withLines },
        });
        await sendCustomerConfirmation(full);
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

  async POST(req, res) {
    requireAdmin(req);
    const {
      eventDate, lines, customer, delivery, taxCents, amountPaidCents,
      paymentMethod, status, adminNote, force,
    } = req.body ?? {};
    const date = parseEventDate(eventDate);

    let result;
    try {
      result = await createManualBooking({
        eventDate: date,
        lines,
        customer,
        delivery,
        taxCents,
        amountPaidCents,
        paymentMethod,
        status,
        adminNote,
        force: Boolean(force),
      });
    } catch (err) {
      if (err.shortfalls || err.blackout || err.atCap) {
        // Admin endpoint — unlike the public checkout response, full shortfall
        // detail (available/stock) is fine to return since the caller is trusted.
        res.status(409).json({
          error: err.message,
          shortfalls: err.shortfalls ?? [],
          blackout: Boolean(err.blackout),
          atCap: Boolean(err.atCap),
        });
        return; // already sent; withApi won't resend
      }
      throw err;
    }

    const full = await prisma.booking.findUnique({
      where: { id: result.booking.id },
      include: { lines: withLines },
    });
    return { ...serialize(full), warnings: result.warnings };
  },
});
