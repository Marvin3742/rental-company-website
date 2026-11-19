-- Small-order fee settings: $25 on orders whose rentals subtotal is under $50.
-- The existing settings row picks up these defaults, so the fee is on as soon as
-- this runs (set the fee to 0 in Admin → Settings to turn it off).
ALTER TABLE "Setting" ADD COLUMN "smallOrderThresholdCents" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN "smallOrderFeeCents" INTEGER NOT NULL DEFAULT 2500;

-- Small-order fee charged on a booking (0 for every existing booking), and the
-- Google Ads click (gclid/gbraid/wbraid) that led to it.
ALTER TABLE "Booking" ADD COLUMN "smallOrderFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "clickId" TEXT,
ADD COLUMN "clickIdType" TEXT;
