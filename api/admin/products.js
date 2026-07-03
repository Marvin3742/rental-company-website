// GET   /api/admin/products                       → list products
// POST  /api/admin/products { name, priceCents, unit, totalStock, description?, images? }
// PATCH /api/admin/products { id, totalStock?, priceCents?, active? }
import { withApi, HttpError } from "../../lib/server/http.js";
import { prisma } from "../../lib/server/prisma.js";
import { requireAdmin } from "../../lib/server/auth.js";

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "item";

async function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

const nonNegInt = (v, label) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new HttpError(400, `${label} must be a non-negative integer`);
  return n;
};

export default withApi({
  async GET(req) {
    requireAdmin(req);
    const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      unit: p.unit,
      priceCents: p.priceCents,
      totalStock: p.totalStock,
      active: p.active,
      images: Array.isArray(p.images) ? p.images : [],
    }));
  },

  async POST(req) {
    requireAdmin(req);
    const { name, priceCents, unit, totalStock, description, images } = req.body ?? {};
    if (!name || !String(name).trim()) throw new HttpError(400, "Name is required");

    const product = await prisma.product.create({
      data: {
        slug: await uniqueSlug(name),
        name: String(name).trim(),
        priceCents: nonNegInt(priceCents, "priceCents"),
        unit: unit === "DAY" ? "DAY" : "EACH",
        totalStock: nonNegInt(totalStock ?? 0, "totalStock"),
        description: description ? String(description).trim() : null,
        images: Array.isArray(images) ? images.filter(Boolean) : [],
        details: [],
        active: true,
      },
    });
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      priceCents: product.priceCents,
      totalStock: product.totalStock,
      active: product.active,
      images: Array.isArray(product.images) ? product.images : [],
    };
  },

  async PATCH(req) {
    requireAdmin(req);
    const { id, totalStock, priceCents, active, images } = req.body ?? {};
    if (!id) throw new HttpError(400, "id is required");

    const data = {};
    if (totalStock !== undefined) {
      const n = Number(totalStock);
      if (!Number.isInteger(n) || n < 0) throw new HttpError(400, "totalStock must be a non-negative integer");
      data.totalStock = n;
    }
    if (priceCents !== undefined) {
      const n = Number(priceCents);
      if (!Number.isInteger(n) || n < 0) throw new HttpError(400, "priceCents must be a non-negative integer");
      data.priceCents = n;
    }
    if (active !== undefined) data.active = Boolean(active);
    if (images !== undefined) {
      if (!Array.isArray(images)) throw new HttpError(400, "images must be an array");
      data.images = images.filter(Boolean);
    }
    if (Object.keys(data).length === 0) throw new HttpError(400, "Nothing to update");

    const p = await prisma.product.update({ where: { id }, data });
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      unit: p.unit,
      priceCents: p.priceCents,
      totalStock: p.totalStock,
      active: p.active,
      images: Array.isArray(p.images) ? p.images : [],
    };
  },

  async DELETE(req) {
    requireAdmin(req);
    const { id } = req.body ?? {};
    if (!id) throw new HttpError(400, "id is required");

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new HttpError(404, "Item not found");

    // Guard rails: keep the catalog and booking history consistent.
    const [inPackages, reservationCount] = await Promise.all([
      prisma.packageItem.findMany({
        where: { productId: id },
        include: { package: { select: { name: true } } },
      }),
      prisma.reservation.count({ where: { productId: id } }),
    ]);

    if (inPackages.length > 0) {
      const names = [...new Set(inPackages.map((pi) => pi.package?.name).filter(Boolean))].join(", ");
      throw new HttpError(409, `This item is part of ${names || "a package"}. Remove it from the package before deleting.`);
    }
    if (reservationCount > 0) {
      // Reservation.product is ON DELETE RESTRICT, and we want to preserve order history.
      throw new HttpError(409, "This item has booking history, so it can't be deleted. Turn off Active to hide it instead.");
    }

    // Delete any item-specific blackouts first: a SET NULL would turn them into
    // global (all-item) blackouts, which is not the intent.
    await prisma.$transaction([
      prisma.blackout.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
    return { id, deleted: true };
  },
});
