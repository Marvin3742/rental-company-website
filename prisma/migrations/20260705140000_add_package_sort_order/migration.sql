-- Admin-controlled display order for Packages (was sorted by priceCents desc,
-- which scrambled the intended reading order).
ALTER TABLE "Package" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
