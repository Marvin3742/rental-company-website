// GET /api/packages → active packages for public display (name, price, image, includes…).
// Makes the home + rentals pages reflect admin edits, just like /api/products.
import { withApi } from "../lib/server/http.js";
import { prisma } from "../lib/server/prisma.js";

export default withApi({
  async GET() {
    const packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return packages.map((p) => ({
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      image: p.image,
      includes: Array.isArray(p.includesDisplay) ? p.includesDisplay : [],
      badge: p.badge,
      tagline: p.tagline,
    }));
  },
});
