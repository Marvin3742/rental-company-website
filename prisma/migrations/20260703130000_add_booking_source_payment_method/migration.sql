-- Manual booking support: tag booking origin, and record how the initial
-- payment (if any) was taken for bookings created outside Stripe checkout.
CREATE TYPE "BookingSource" AS ENUM ('WEB', 'MANUAL');

ALTER TABLE "Booking" ADD COLUMN "source" "BookingSource" NOT NULL DEFAULT 'WEB';
ALTER TABLE "Booking" ADD COLUMN "paymentMethod" TEXT;

CREATE INDEX "Booking_source_idx" ON "Booking"("source");
