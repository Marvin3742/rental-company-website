// Dev utility: wipe all bookings (and their reservations + lines) for a fresh test run.
// Leaves products, packages, blackouts, settings, and admin users intact.
// Run: node --env-file=.env prisma/clear-bookings.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const before = await prisma.booking.count();
console.log(`Bookings before: ${before}`);

await prisma.$transaction([
  prisma.reservation.deleteMany({}),
  prisma.bookingLine.deleteMany({}),
  prisma.booking.deleteMany({}),
]);

console.log(`Bookings after:  ${await prisma.booking.count()}`);
await prisma.$disconnect();
