// Idempotent seed: mirrors prisma/seed-data.js into the database and applies the
// owner-supplied stock counts + package bill-of-materials from seed-stock.json.
// Safe to re-run — everything is upserted by slug. Run with: `npx prisma db seed`.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { inventory, packages } from "./seed-data.js";

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));
const stockConfig = JSON.parse(readFileSync(join(here, "seed-stock.json"), "utf8"));

const toCents = (dollars) => Math.round(dollars * 100);
const unitEnum = (unit) => (unit === "each" ? "EACH" : "DAY");

async function main() {
  const defaultTaxCode = stockConfig.stripeTaxCodes?.default ?? null;

  // 1) Products (from inventory[]) — marketing copy from content.js, stock from seed-stock.json.
  for (const item of inventory) {
    const totalStock = stockConfig.stock?.[item.id] ?? 0;
    const data = {
      name: item.name,
      description: item.description ?? null,
      details: item.details ?? [],
      images: item.images ?? (item.image ? [item.image] : []),
      priceCents: toCents(item.price),
      unit: unitEnum(item.unit),
      totalStock,
      stripeTaxCode: defaultTaxCode,
      active: true,
    };
    await prisma.product.upsert({
      where: { slug: item.id },
      create: { slug: item.id, ...data },
      update: data,
    });
    if (!stockConfig.stock?.[item.id]) {
      console.warn(`  ⚠ no stock count for "${item.id}" — defaulted to 0`);
    }
  }
  console.log(`✓ Seeded ${inventory.length} products`);

  // 2) Packages (from packages[]) — keep the human `includes` strings verbatim.
  for (const pkg of packages) {
    const data = {
      name: pkg.name,
      priceCents: toCents(pkg.price),
      image: pkg.image ?? null,
      includesDisplay: pkg.includes ?? [],
      badge: pkg.badge ?? null,
      tagline: pkg.tagline ?? null,
      active: true,
    };
    await prisma.package.upsert({
      where: { slug: pkg.id },
      create: { slug: pkg.id, ...data },
      update: data,
    });
  }
  console.log(`✓ Seeded ${packages.length} packages`);

  // 3) Package bill-of-materials (structured — drives availability).
  const productIdBySlug = Object.fromEntries(
    (await prisma.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id])
  );
  const packageIdBySlug = Object.fromEntries(
    (await prisma.package.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id])
  );

  for (const [pkgSlug, components] of Object.entries(stockConfig.packageBom ?? {})) {
    const packageId = packageIdBySlug[pkgSlug];
    if (!packageId) {
      console.warn(`  ⚠ packageBom references unknown package "${pkgSlug}" — skipped`);
      continue;
    }
    // Replace the BOM wholesale so re-seeding reflects edits.
    await prisma.packageItem.deleteMany({ where: { packageId } });
    for (const c of components) {
      const productId = productIdBySlug[c.productSlug];
      if (!productId) {
        console.warn(`  ⚠ BOM for "${pkgSlug}" references unknown product "${c.productSlug}" — skipped`);
        continue;
      }
      await prisma.packageItem.create({
        data: { packageId, productId, quantity: c.quantity },
      });
    }
  }
  console.log(`✓ Seeded package bill-of-materials`);

  // 4) Single-row settings (only creates defaults; never clobbers owner edits).
  await prisma.setting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  console.log(`✓ Settings singleton ensured`);
}

main()
  .then(() => console.log("Seed complete."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
