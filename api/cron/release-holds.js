// GET /api/cron/release-holds — Vercel Cron sweep that frees expired holds.
// Availability reads already ignore expired holds, so this is cleanup, not
// correctness-critical. Protected by CRON_SECRET when configured.
import { prisma } from "../../lib/server/prisma.js";

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers["authorization"] || "";
    if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();
  const expired = await prisma.booking.findMany({
    where: { status: "PENDING", holdExpiresAt: { lt: now } },
    select: { id: true, discountCodeId: true },
  });
  const ids = expired.map((b) => b.id);
  const discountCodeIds = expired.map((b) => b.discountCodeId).filter(Boolean);

  if (ids.length > 0) {
    await prisma.$transaction([
      prisma.reservation.updateMany({
        where: { bookingId: { in: ids }, status: "HELD" },
        data: { status: "RELEASED", expiresAt: null },
      }),
      prisma.booking.updateMany({
        where: { id: { in: ids } },
        data: { status: "EXPIRED", holdExpiresAt: null },
      }),
      // Release any discount codes claimed by these abandoned holds.
      ...(discountCodeIds.length > 0
        ? [prisma.discountCode.updateMany({ where: { id: { in: discountCodeIds } }, data: { usedAt: null } })]
        : []),
    ]);
  }

  return res.status(200).json({ released: ids.length });
}
