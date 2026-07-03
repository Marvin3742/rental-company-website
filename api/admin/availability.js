// GET /api/admin/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// Per-day inventory state for the admin calendar: for each day in the range, how
// many of each product are committed (active reservations, including the turnaround
// buffer tail) vs. available, plus delivery-cap usage and blackouts.
//
// Computed from a single set of queries (reservations/blackouts/bookings overlapping
// the range) then folded per day in memory, so cost is flat regardless of range size.
import { withApi, HttpError } from "../../lib/server/http.js";
import { prisma } from "../../lib/server/prisma.js";
import { requireAdmin } from "../../lib/server/auth.js";
import { parseEventDate, ymd, getSettings } from "../../lib/server/availability.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export default withApi({
  async GET(req) {
    requireAdmin(req);
    const { from, to } = req.query ?? {};
    const start = parseEventDate(from);
    const end = parseEventDate(to);
    if (end.getTime() < start.getTime()) {
      throw new HttpError(400, "`to` must be on or after `from`");
    }
    if (Math.round((end - start) / DAY_MS) + 1 > 100) {
      throw new HttpError(400, "Range too large (max 100 days)");
    }

    const now = new Date();
    const settings = await getSettings();

    const products = await prisma.product.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, totalStock: true },
      orderBy: { name: "asc" },
    });
    const productIds = products.map((p) => p.id);

    const [reservations, blackouts, bookings] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          productId: { in: productIds },
          startDate: { lte: end },
          endDate: { gte: start },
          OR: [{ status: "CONFIRMED" }, { status: "HELD", expiresAt: { gt: now } }],
        },
        select: { productId: true, quantity: true, startDate: true, endDate: true },
      }),
      prisma.blackout.findMany({
        where: {
          startDate: { lte: end },
          endDate: { gte: start },
          OR: [{ productId: null }, { productId: { in: productIds } }],
        },
        select: { productId: true, startDate: true, endDate: true },
      }),
      prisma.booking.findMany({
        where: {
          eventDate: { gte: start, lte: end },
          OR: [{ status: "CONFIRMED" }, { status: "PENDING", holdExpiresAt: { gt: now } }],
        },
        select: { eventDate: true },
      }),
    ]);

    const bookingsByDay = new Map();
    for (const b of bookings) {
      const k = ymd(b.eventDate);
      bookingsByDay.set(k, (bookingsByDay.get(k) ?? 0) + 1);
    }

    const days = {};
    for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
      const key = ymd(new Date(t));

      const reservedByProduct = new Map();
      for (const r of reservations) {
        if (r.startDate.getTime() <= t && t <= r.endDate.getTime()) {
          reservedByProduct.set(
            r.productId,
            (reservedByProduct.get(r.productId) ?? 0) + r.quantity
          );
        }
      }

      let globalBlackout = false;
      const blackedOut = new Set();
      for (const bl of blackouts) {
        if (bl.startDate.getTime() <= t && t <= bl.endDate.getTime()) {
          if (bl.productId === null) globalBlackout = true;
          else blackedOut.add(bl.productId);
        }
      }

      const bookingsOnDate = bookingsByDay.get(key) ?? 0;

      // Only emit the products that are actually constrained that day; the client
      // treats every other product as fully available (available === totalStock).
      const items = [];
      for (const p of products) {
        const reserved = reservedByProduct.get(p.id) ?? 0;
        const isBlack = globalBlackout || blackedOut.has(p.id);
        if (reserved === 0 && !isBlack) continue;
        items.push({
          slug: p.slug,
          name: p.name,
          stock: p.totalStock,
          reserved,
          available: isBlack ? 0 : Math.max(0, p.totalStock - reserved),
          blackedOut: isBlack,
        });
      }

      if (items.length === 0 && bookingsOnDate === 0 && !globalBlackout) continue;

      days[key] = {
        bookings: bookingsOnDate,
        atCap: bookingsOnDate >= settings.maxBookingsPerDay,
        globalBlackout,
        items,
      };
    }

    return {
      from: ymd(start),
      to: ymd(end),
      maxBookingsPerDay: settings.maxBookingsPerDay,
      products: products.map((p) => ({ slug: p.slug, name: p.name, totalStock: p.totalStock })),
      days,
    };
  },
});
