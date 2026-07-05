// One-time discount codes (friends & family). A code is claimed atomically at
// booking-hold time (mirrors inventory Reservations going HELD) and released
// back to available if that booking's hold expires or is cancelled before
// payment confirms (mirrors HELD -> RELEASED) — see releaseDiscountCode's
// three call sites: the hold-expiry cron, the Stripe checkout.session.expired
// handler, and the admin "cancel booking" action.
import { prisma } from "./prisma.js";
import { HttpError } from "./http.js";

// Excludes ambiguous characters (0/O, 1/I) so a code is easy to read back over
// a text message.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `FAM-${s}`;
}

/** Generate a unique, shareable code (retries on the rare collision). */
export async function generateCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await prisma.discountCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new HttpError(500, "Could not generate a unique discount code, try again");
}

/** Compute the discount amount for a given kind/value against a base (pre-tax) total. */
export function computeDiscountCents(kind, value, baseCents) {
  const raw = kind === "PERCENT" ? Math.round((baseCents * value) / 100) : value;
  return Math.max(0, Math.min(raw, baseCents));
}

/**
 * Read-only check for the checkout page's live "Apply" button — does NOT
 * claim the code. The actual one-time claim happens later, atomically, in
 * claimDiscountCode() at final submit, so repeatedly previewing a code can
 * never burn it.
 */
export async function previewDiscount(code, baseCents) {
  const record = await prisma.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!record) return { valid: false, reason: "not_found" };
  if (record.usedAt) return { valid: false, reason: "already_used" };
  return {
    valid: true,
    kind: record.kind,
    value: record.value,
    discountCents: computeDiscountCents(record.kind, record.value, baseCents),
  };
}

/**
 * Atomically claim a discount code for a booking being created in `tx`.
 * Throws HttpError(404) if the code doesn't exist, or HttpError(409) if it's
 * already been used (including the race where another request claims it
 * first — Prisma's conditional `where: { usedAt: null }` simply won't match,
 * which surfaces as a P2025 "record not found").
 *
 * @returns { discountCodeId, discountCents }
 */
export async function claimDiscountCode(code, baseCents, tx) {
  const record = await tx.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!record) throw new HttpError(404, "That discount code doesn't exist.");
  if (record.usedAt) throw new HttpError(409, "That discount code has already been used.");

  try {
    await tx.discountCode.update({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
  } catch (err) {
    if (err.code === "P2025") {
      throw new HttpError(409, "That discount code has already been used.");
    }
    throw err;
  }

  return { discountCodeId: record.id, discountCents: computeDiscountCents(record.kind, record.value, baseCents) };
}

/** Release the discount code (if any) tied to a booking back to available. */
export async function releaseDiscountCode(bookingId, tx = prisma) {
  const booking = await tx.booking.findUnique({ where: { id: bookingId }, select: { discountCodeId: true } });
  if (!booking?.discountCodeId) return;
  await tx.discountCode.update({ where: { id: booking.discountCodeId }, data: { usedAt: null } });
}
