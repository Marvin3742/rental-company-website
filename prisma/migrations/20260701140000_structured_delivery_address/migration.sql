-- AlterTable: add structured delivery address columns.
-- Nullable + additive, so existing bookings stay valid (their address lives on in
-- the composed `deliveryAddress` string). New bookings populate these directly.
ALTER TABLE "Booking" ADD COLUMN     "deliveryStreet" TEXT,
ADD COLUMN     "deliveryUnit" TEXT,
ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryState" TEXT,
ADD COLUMN     "deliveryZip" TEXT,
ADD COLUMN     "deliveryNotes" TEXT;

-- Helps the admin dashboard filter/sort bookings by city.
CREATE INDEX "Booking_deliveryCity_idx" ON "Booking"("deliveryCity");
