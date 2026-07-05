// GET    /api/admin/discounts                          → list all codes
// POST   /api/admin/discounts { kind, value, note? }    → generate a one-time code
// DELETE /api/admin/discounts { id }                    → revoke an unused code
import { withApi, HttpError } from "../http.js";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../auth.js";
import { generateCode } from "../discounts.js";

function serialize(d) {
  return {
    id: d.id,
    code: d.code,
    kind: d.kind,
    value: d.value,
    note: d.note,
    createdAt: d.createdAt.toISOString(),
    usedAt: d.usedAt ? d.usedAt.toISOString() : null,
    usedByBooking: d.booking
      ? { id: d.booking.id, customerName: d.booking.customerName, eventDate: d.booking.eventDate.toISOString().slice(0, 10) }
      : null,
  };
}

export default withApi({
  async GET(req) {
    requireAdmin(req);
    const rows = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { booking: { select: { id: true, customerName: true, eventDate: true } } },
    });
    return rows.map(serialize);
  },

  async POST(req) {
    requireAdmin(req);
    const { kind, value, note } = req.body ?? {};
    if (!["PERCENT", "FIXED"].includes(kind)) throw new HttpError(400, "kind must be PERCENT or FIXED");
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "value must be a positive integer");
    if (kind === "PERCENT" && n > 100) throw new HttpError(400, "Percent discount can't exceed 100");

    const code = await generateCode();
    const row = await prisma.discountCode.create({
      data: { code, kind, value: n, note: note?.trim() || null },
    });
    return serialize(row);
  },

  async DELETE(req) {
    requireAdmin(req);
    const { id } = req.body ?? {};
    if (!id) throw new HttpError(400, "id is required");
    const row = await prisma.discountCode.findUnique({ where: { id } });
    if (!row) throw new HttpError(404, "Discount code not found");
    if (row.usedAt) throw new HttpError(400, "Can't delete a code that's already been used");
    await prisma.discountCode.delete({ where: { id } });
    return { ok: true };
  },
});
