-- Rentals-page sectioning + admin-controlled display order.
CREATE TYPE "ProductCategory" AS ENUM ('TENTS_TABLES_CHAIRS', 'INFLATABLES');

ALTER TABLE "Product" ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'TENTS_TABLES_CHAIRS';
ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
