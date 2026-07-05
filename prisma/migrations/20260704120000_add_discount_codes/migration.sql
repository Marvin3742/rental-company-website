-- One-time discount codes (friends & family). A code is claimed by setting
-- usedAt + the redeeming Booking's discountCodeId; released back to available
-- by clearing usedAt if that booking's hold expires/cancels.
CREATE TYPE "DiscountKind" AS ENUM ('PERCENT', 'FIXED');

CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "DiscountKind" NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

ALTER TABLE "Booking" ADD COLUMN "discountCodeId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "discountCents" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Booking_discountCodeId_key" ON "Booking"("discountCodeId");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_discountCodeId_fkey"
    FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
