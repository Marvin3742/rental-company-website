// GET    /api/admin/blackouts                                  → list
// POST   /api/admin/blackouts { productSlug?, startDate, endDate, reason? }  (no productSlug = whole day)
// DELETE /api/admin/blackouts { id }
import { withApi, HttpError } from "../http.js";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../auth.js";

const toDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) throw new HttpError(400, "Dates must be YYYY-MM-DD");
  return new Date(`${s}T00:00:00.000Z`);
};

export default withApi({
  async GET(req) {
    requireAdmin(req);
    const rows = await prisma.blackout.findMany({
      orderBy: { startDate: "asc" },
      include: { product: { select: { name: true, slug: true } } },
    });
    return rows.map((b) => ({
      id: b.id,
      productName: b.product?.name ?? "All items (whole day)",
      startDate: b.startDate.toISOString().slice(0, 10),
      endDate: b.endDate.toISOString().slice(0, 10),
      reason: b.reason,
    }));
  },

  async POST(req) {
    requireAdmin(req);
    const { productSlug, startDate, endDate, reason } = req.body ?? {};
    const start = toDate(startDate);
    const end = toDate(endDate);
    if (end < start) throw new HttpError(400, "End date must be on or after start date");

    let productId = null;
    if (productSlug) {
      const product = await prisma.product.findUnique({ where: { slug: productSlug } });
      if (!product) throw new HttpError(400, `Unknown product "${productSlug}"`);
      productId = product.id;
    }
    const b = await prisma.blackout.create({
      data: { productId, startDate: start, endDate: end, reason: reason || null },
    });
    return { id: b.id };
  },

  async DELETE(req) {
    requireAdmin(req);
    const { id } = req.body ?? {};
    if (!id) throw new HttpError(400, "id is required");
    await prisma.blackout.delete({ where: { id } });
    return { ok: true };
  },
});
