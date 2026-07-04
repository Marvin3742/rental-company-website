-- Rename the Booking lifecycle stage CONFIRMED -> UPCOMING (a booking that's
-- locked in but hasn't happened yet). Existing rows keep their value, just
-- relabeled — this does NOT touch ReservationStatus.CONFIRMED, a separate
-- enum for the internal inventory-hold state.
ALTER TYPE "BookingStatus" RENAME VALUE 'CONFIRMED' TO 'UPCOMING';
