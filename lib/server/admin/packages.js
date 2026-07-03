// GET    /api/admin/packages                → list packages (with bill-of-materials)
// POST   /api/admin/packages { ...fields }   → create a package
// PATCH  /api/admin/packages { id, ...fields }→ update fields and/or the BOM
// DELETE /api/admin/packages { id }           → delete (blocked if it has booking history)
import { withApi, HttpError } from "../http.js";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../auth.js";

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "package";

async function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.package.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
  return slug;
}

const nonNegInt = (v, label) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new HttpError(400, `${label} must be a non-negative integer`);
  return n;
};

/** Validate + merge a bill-of-materials array. Returns undefined if `items` wasn't provided. */
async function normalizeItems(items) {
  if (items === undefined) return undefined;
  if (!Array.isArray(items)) throw new HttpError(400, "items must be an array");

  const merged = new Map(); // productId -> quantity
  for (const it of items) {
    if (!it?.productId) continue;
    const qty = nonNegInt(it.quantity, "item quantity");
    if (qty <= 0) continue;
    merged.set(String(it.productId), (merged.get(String(it.productId)) ?? 0) + qty);
  }
  const result = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));

  if (result.length > 0) {
    const found = await prisma.product.findMany({
      where: { id: { in: result.map((r) => r.productId) } },
      select: { id: true },
    });
    const ok = new Set(found.map((f) => f.id));
    for (const r of result) {
      if (!ok.has(r.productId)) throw new HttpError(400, "A selected item no longer exists");
    }
  }
  return result;
}

const withItems = {
  include: { items: { include: { product: { select: { name: true, slug: true } } } } },
};

function serialize(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    image: p.image,
    includesDisplay: Array.isArray(p.includesDisplay) ? p.includesDisplay : [],
    badge: p.badge,
    tagline: p.tagline,
    active: p.active,
    items: (p.items ?? []).map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      name: it.product?.name ?? null,
      slug: it.product?.slug ?? null,
    })),
  };
}

export default withApi({
  async GET(req) {
    requireAdmin(req);
    const packages = await prisma.package.findMany({ orderBy: { priceCents: "desc" }, ...withItems });
    return packages.map(serialize);
  },

  async POST(req) {
    requireAdmin(req);
    const { name, priceCents, image, includesDisplay, badge, tagline, items } = req.body ?? {};
    if (!name || !String(name).trim()) throw new HttpError(400, "Name is required");
    const bom = (await normalizeItems(items)) ?? [];

    const pkg = await prisma.package.create({
      data: {
        slug: await uniqueSlug(name),
        name: String(name).trim(),
        priceCents: nonNegInt(priceCents, "priceCents"),
        image: image ? String(image) : null,
        includesDisplay: Array.isArray(includesDisplay) ? includesDisplay.filter(Boolean) : [],
        badge: badge ? String(badge).trim() : null,
        tagline: tagline ? String(tagline).trim() : null,
        active: true,
        items: { create: bom },
      },
      ...withItems,
    });
    return serialize(pkg);
  },

  async PATCH(req) {
    requireAdmin(req);
    const { id, name, priceCents, image, includesDisplay, badge, tagline, active, items } = req.body ?? {};
    if (!id) throw new HttpError(400, "id is required");
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Package not found");

    const data = {};
    if (name !== undefined) {
      if (!String(name).trim()) throw new HttpError(400, "Name can't be empty");
      data.name = String(name).trim();
    }
    if (priceCents !== undefined) data.priceCents = nonNegInt(priceCents, "priceCents");
    if (image !== undefined) data.image = image ? String(image) : null;
    if (includesDisplay !== undefined) {
      if (!Array.isArray(includesDisplay)) throw new HttpError(400, "includesDisplay must be an array");
      data.includesDisplay = includesDisplay.filter(Boolean);
    }
    if (badge !== undefined) data.badge = badge ? String(badge).trim() : null;
    if (tagline !== undefined) data.tagline = tagline ? String(tagline).trim() : null;
    if (active !== undefined) data.active = Boolean(active);

    const bom = await normalizeItems(items); // undefined = leave BOM untouched

    const pkg = await prisma.$transaction(async (tx) => {
      if (bom !== undefined) {
        await tx.packageItem.deleteMany({ where: { packageId: id } });
        if (bom.length > 0) {
          await tx.packageItem.createMany({ data: bom.map((b) => ({ packageId: id, ...b })) });
        }
      }
      return tx.package.update({ where: { id }, data, ...withItems });
    });
    return serialize(pkg);
  },

  async DELETE(req) {
    requireAdmin(req);
    const { id } = req.body ?? {};
    if (!id) throw new HttpError(400, "id is required");
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Package not found");

    const bookingLines = await prisma.bookingLine.count({ where: { sourcePackageId: id } });
    if (bookingLines > 0) {
      throw new HttpError(409, "This package has booking history and can't be deleted. Turn off Active to hide it instead.");
    }

    // PackageItem rows cascade-delete with the package.
    await prisma.package.delete({ where: { id } });
    return { id, deleted: true };
  },
});
