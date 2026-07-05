// GET /api/products → active rental items for public display (name, price, images…).
// This makes the rentals page reflect admin edits (price, new items, active on/off).
import { withApi } from "../lib/server/http.js";
import { prisma } from "../lib/server/prisma.js";

export default withApi({
  async GET() {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return products.map((p) => ({
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      unit: p.unit.toLowerCase(),
      images: p.images ?? [],
      description: p.description,
      details: p.details ?? [],
      category: p.category,
    }));
  },
});
