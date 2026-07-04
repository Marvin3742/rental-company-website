// Booking holds — the concurrency-safe core of the payment flow.
//
// createBookingHold() runs in a Serializable transaction and locks the contended
// product rows (SELECT ... FOR UPDATE) before re-checking availability, so two
// customers racing for the last tent can't both succeed. Prices are always
// recomputed from the DB — client-supplied amounts are ignored.

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { HttpError } from "./http.js";
import { quoteDelivery } from "./delivery.js";
import {
  reservationWindow,
  reservedByProduct,
  blackoutsForWindow,
  bookingsOnDate,
  getSettings,
} from "./availability.js";

const PAYMENT_METHODS = ["cash", "zelle", "venmo", "card", "other"];

// Hold must outlive the Stripe Checkout session (30 min) so the inventory stays
// reserved for the entire payable window; the cron only releases it afterwards.
const HOLD_MINUTES = 32;

function validateCustomer(c) {
  if (!c) throw new HttpError(400, "Missing customer details");
  for (const field of ["name", "email", "phone", "street", "city", "state", "zip"]) {
    if (!c[field] || !String(c[field]).trim()) throw new HttpError(400, `Missing ${field}`);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) throw new HttpError(400, "Invalid email address");
}

/** Compose the structured address (+ optional notes) into a stored multi-line string. */
function composeAddress({ street, unit, city, state, zip, notes }) {
  return [
    unit ? `${street}, ${unit}` : street,
    `${city}, ${state} ${zip}`,
    notes ? `Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Resolve cart lines into priced booking lines + merged product demand (DB prices). */
async function resolveCart(lines, client = prisma) {
  if (!Array.isArray(lines) || lines.length === 0) throw new HttpError(400, "Cart is empty");

  const productSlugs = [];
  const packageSlugs = [];
  for (const l of lines) {
    const q = Number(l?.quantity);
    if (!l?.slug || !Number.isInteger(q) || q <= 0) {
      throw new HttpError(400, `Invalid cart line: ${JSON.stringify(l)}`);
    }
    if (l.kind === "product") productSlugs.push(l.slug);
    else if (l.kind === "package") packageSlugs.push(l.slug);
    else throw new HttpError(400, `Unknown line kind "${l.kind}"`);
  }

  const [products, packages] = await Promise.all([
    client.product.findMany({ where: { slug: { in: productSlugs } } }),
    client.package.findMany({
      where: { slug: { in: packageSlugs } },
      include: { items: { include: { product: true } } },
    }),
  ]);
  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const packageBySlug = new Map(packages.map((p) => [p.slug, p]));

  const demand = new Map(); // productId -> { product, quantity }
  const addDemand = (product, qty) => {
    const cur = demand.get(product.id) ?? { product, quantity: 0 };
    cur.quantity += qty;
    demand.set(product.id, cur);
  };

  const bookingLines = [];
  const displayLines = []; // for Stripe line items (full-payment mode)
  let subtotalCents = 0;

  for (const l of lines) {
    if (l.kind === "product") {
      const p = productBySlug.get(l.slug);
      if (!p || !p.active) throw new HttpError(400, `Unavailable product "${l.slug}"`);
      bookingLines.push({
        lineType: "ITEM",
        productId: p.id,
        sourcePackageId: null,
        quantity: l.quantity,
        unitPriceCents: p.priceCents,
      });
      displayLines.push({ name: p.name, unitPriceCents: p.priceCents, quantity: l.quantity });
      subtotalCents += p.priceCents * l.quantity;
      addDemand(p, l.quantity);
    } else {
      const pk = packageBySlug.get(l.slug);
      if (!pk || !pk.active) throw new HttpError(400, `Unavailable package "${l.slug}"`);
      bookingLines.push({
        lineType: "PACKAGE_DISPLAY",
        productId: null,
        sourcePackageId: pk.id,
        quantity: l.quantity,
        unitPriceCents: pk.priceCents,
      });
      displayLines.push({ name: pk.name, unitPriceCents: pk.priceCents, quantity: l.quantity });
      subtotalCents += pk.priceCents * l.quantity;
      for (const item of pk.items) addDemand(item.product, item.quantity * l.quantity);
    }
  }

  return { demand, bookingLines, displayLines, subtotalCents };
}

/**
 * Create a PENDING booking with HELD reservations, atomically and oversell-safe.
 * @returns pricing breakdown + the created booking (for building the Stripe session)
 */
export async function createBookingHold({ eventDate, lines, customer, paymentMode }) {
  if (!["FULL", "DEPOSIT"].includes(paymentMode)) throw new HttpError(400, "Invalid paymentMode");
  validateCustomer(customer);

  const settings = await getSettings();
  const window = reservationWindow(eventDate, settings.bufferDays);
  const { demand, bookingLines, displayLines, subtotalCents } = await resolveCart(lines);
  const productIds = [...demand.keys()].sort(); // stable lock order avoids deadlocks

  // Delivery fee by straight-line distance from the shop (server-authoritative).
  const quote = await quoteDelivery(customer);
  if (!quote.serviceable) {
    throw new HttpError(
      422,
      quote.reason === "too_far"
        ? "That address is outside our 50-mile delivery area. Please call us to arrange."
        : "We couldn't verify that delivery address. Please double-check it or call us."
    );
  }
  const deliveryFeeCents = quote.feeCents;
  const deliveryAddress = composeAddress(customer);
  const totalCents = subtotalCents + deliveryFeeCents;
  const depositCents =
    paymentMode === "DEPOSIT" ? Math.round((totalCents * settings.depositPct) / 100) : totalCents;
  const chargeNowCents = paymentMode === "DEPOSIT" ? depositCents : totalCents;
  const balanceDueCents = totalCents - chargeNowCents;
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  const booking = await prisma.$transaction(
    async (tx) => {
      // Serialize concurrent buyers of the same products.
      if (productIds.length > 0) {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "Product" WHERE id IN (${Prisma.join(productIds)}) ORDER BY id FOR UPDATE`
        );
      }

      const now = new Date();
      const [reserved, blackout, dayCount] = await Promise.all([
        reservedByProduct(productIds, window, now, tx),
        blackoutsForWindow(productIds, window, tx),
        bookingsOnDate(eventDate, now, tx),
      ]);

      if (blackout.global) throw new HttpError(409, "This date is unavailable for delivery.");
      if (dayCount >= settings.maxBookingsPerDay) {
        throw new HttpError(409, "This date is fully booked for delivery.");
      }

      const shortfalls = [];
      for (const { product, quantity } of demand.values()) {
        const available = blackout.blocked.has(product.id)
          ? 0
          : Math.max(0, product.totalStock - (reserved.get(product.id) ?? 0));
        if (available < quantity) {
          shortfalls.push({ slug: product.slug, name: product.name, requested: quantity, available });
        }
      }
      if (shortfalls.length > 0) {
        const err = new HttpError(409, "Some items are no longer available for this date.");
        err.shortfalls = shortfalls;
        throw err;
      }

      return tx.booking.create({
        data: {
          status: "PENDING",
          eventDate,
          dropoffLatestTime: customer.dropoffLatest || null,
          pickupEarliestTime: customer.pickupEarliest || null,
          pickupSameDay: Boolean(customer.pickupSameDay),
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          deliveryAddress, // composed string kept for receipts/display
          deliveryStreet: customer.street.trim(),
          deliveryUnit: customer.unit?.trim() || null,
          deliveryCity: customer.city.trim(),
          deliveryState: customer.state.trim(),
          deliveryZip: customer.zip.trim(),
          deliveryNotes: customer.notes?.trim() || null,
          subtotalCents,
          deliveryFeeCents,
          totalCents,
          paymentMode,
          amountPaidCents: 0,
          balanceDueCents,
          holdExpiresAt,
          lines: { create: bookingLines },
          reservations: {
            create: [...demand.values()].map(({ product, quantity }) => ({
              productId: product.id,
              quantity,
              startDate: window.start,
              endDate: window.end,
              status: "HELD",
              expiresAt: holdExpiresAt,
            })),
          },
        },
      });
    },
    // Read Committed is sufficient here: the FOR UPDATE lock on the contended
    // product rows fully serializes competing bookings, and the post-lock read
    // then sees the winner's committed reservation (clean 409 for the loser).
    { isolationLevel: "ReadCommitted" }
  );

  return {
    booking,
    displayLines,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    depositCents,
    chargeNowCents,
    balanceDueCents,
    depositPct: settings.depositPct,
    paymentMode,
  };
}

// ─── Manual bookings (admin-recorded, outside Stripe checkout) ────────────────
//
// Facebook Marketplace deals, phone bookings, and historical backfill. The
// trust model is inverted from the public flow: the admin is the trusted
// party, so admin-supplied line prices are used as-is (not re-derived from
// the catalog), delivery is free-text with a directly-entered fee (no
// geocoding), and payment may be partial. Product/package existence and
// package BOM explosion still come from the DB — that part is structural,
// not pricing, and drives real Reservation rows either way.

function validateManualCustomer(c) {
  if (!c) throw new HttpError(400, "Missing customer details");
  for (const field of ["name", "email", "phone"]) {
    if (!c[field] || !String(c[field]).trim()) throw new HttpError(400, `Missing ${field}`);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) throw new HttpError(400, "Invalid email address");
}

/** Resolve manual-booking cart lines: same slug/BOM resolution as resolveCart, but
 * trusts the admin-supplied unitPriceCents per line (falling back to the catalog
 * price only if omitted) instead of always re-deriving prices from the DB. */
async function resolveManualCart(lines, client = prisma) {
  if (!Array.isArray(lines) || lines.length === 0) throw new HttpError(400, "Cart is empty");

  const productSlugs = [];
  const packageSlugs = [];
  for (const l of lines) {
    const q = Number(l?.quantity);
    if (!l?.slug || !Number.isInteger(q) || q <= 0) {
      throw new HttpError(400, `Invalid cart line: ${JSON.stringify(l)}`);
    }
    if (l.unitPriceCents != null && (!Number.isInteger(l.unitPriceCents) || l.unitPriceCents < 0)) {
      throw new HttpError(400, `Invalid price for line: ${JSON.stringify(l)}`);
    }
    if (l.kind === "product") productSlugs.push(l.slug);
    else if (l.kind === "package") packageSlugs.push(l.slug);
    else throw new HttpError(400, `Unknown line kind "${l.kind}"`);
  }

  const [products, packages] = await Promise.all([
    client.product.findMany({ where: { slug: { in: productSlugs } } }),
    client.package.findMany({
      where: { slug: { in: packageSlugs } },
      include: { items: { include: { product: true } } },
    }),
  ]);
  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const packageBySlug = new Map(packages.map((p) => [p.slug, p]));

  const demand = new Map();
  const addDemand = (product, qty) => {
    const cur = demand.get(product.id) ?? { product, quantity: 0 };
    cur.quantity += qty;
    demand.set(product.id, cur);
  };

  const bookingLines = [];
  let subtotalCents = 0;

  for (const l of lines) {
    if (l.kind === "product") {
      const p = productBySlug.get(l.slug);
      if (!p) throw new HttpError(400, `Unknown product "${l.slug}"`);
      const unitPriceCents = l.unitPriceCents ?? p.priceCents;
      bookingLines.push({
        lineType: "ITEM",
        productId: p.id,
        sourcePackageId: null,
        quantity: l.quantity,
        unitPriceCents,
      });
      subtotalCents += unitPriceCents * l.quantity;
      addDemand(p, l.quantity);
    } else {
      const pk = packageBySlug.get(l.slug);
      if (!pk) throw new HttpError(400, `Unknown package "${l.slug}"`);
      const unitPriceCents = l.unitPriceCents ?? pk.priceCents;
      bookingLines.push({
        lineType: "PACKAGE_DISPLAY",
        productId: null,
        sourcePackageId: pk.id,
        quantity: l.quantity,
        unitPriceCents,
      });
      subtotalCents += unitPriceCents * l.quantity;
      for (const item of pk.items) addDemand(item.product, item.quantity * l.quantity);
    }
  }

  return { demand, bookingLines, subtotalCents };
}

/**
 * Create a booking recorded by the admin outside the Stripe flow.
 *
 * Past event dates skip the oversell-safe check entirely (nothing today can
 * conflict with history) and their Reservation rows are written RELEASED —
 * never CONFIRMED — so a backfilled booking dated within bufferDays of "today"
 * can't be mistaken for live demand by a fresh availability query. Present/
 * future dates run the same locked check-then-create as createBookingHold,
 * with an admin `force` override for known conflicts.
 *
 * @throws HttpError(409, ...) with `.shortfalls`/`.blackout`/`.atCap` when a
 *         present/future-date conflict is found and `force` is not set.
 */
export async function createManualBooking({
  eventDate,
  lines,
  customer,
  delivery,
  taxCents = 0,
  amountPaidCents = 0,
  paymentMethod,
  status,
  adminNote,
  force = false,
}) {
  if (!["CONFIRMED", "COMPLETED"].includes(status)) {
    throw new HttpError(400, "status must be CONFIRMED or COMPLETED");
  }
  validateManualCustomer(customer);

  const tax = Number(taxCents);
  const paid = Number(amountPaidCents);
  const feeCents = Number(delivery?.feeCents ?? 0);
  if (!Number.isInteger(tax) || tax < 0) throw new HttpError(400, "Invalid taxCents");
  if (!Number.isInteger(paid) || paid < 0) throw new HttpError(400, "Invalid amountPaidCents");
  if (!Number.isInteger(feeCents) || feeCents < 0) throw new HttpError(400, "Invalid delivery fee");
  if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
    throw new HttpError(400, `Invalid paymentMethod "${paymentMethod}"`);
  }

  const { demand, bookingLines, subtotalCents } = await resolveManualCart(lines);
  const productIds = [...demand.keys()].sort(); // stable lock order avoids deadlocks

  const deliveryAddress = delivery?.address?.trim() || "Pickup — no delivery";
  const totalCents = subtotalCents + feeCents + tax;
  if (paid > totalCents) throw new HttpError(400, "Amount paid cannot exceed the total");
  const balanceDueCents = totalCents - paid;
  const paymentMode = paid >= totalCents ? "FULL" : "DEPOSIT";

  const settings = await getSettings();
  const window = reservationWindow(eventDate, settings.bufferDays);
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const isPast = eventDate.getTime() < todayUTC.getTime();

  const baseData = {
    status,
    source: "MANUAL",
    eventDate,
    customerName: customer.name.trim(),
    customerEmail: customer.email.trim(),
    customerPhone: customer.phone.trim(),
    deliveryAddress,
    subtotalCents,
    taxCents: tax,
    deliveryFeeCents: feeCents,
    totalCents,
    paymentMode,
    amountPaidCents: paid,
    balanceDueCents,
    paymentMethod: paymentMethod || null,
    adminNote: adminNote?.trim() || null,
    holdExpiresAt: null,
    confirmedAt: new Date(),
    lines: { create: bookingLines },
  };

  if (isPast) {
    const booking = await prisma.booking.create({
      data: {
        ...baseData,
        reservations: {
          create: [...demand.values()].map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
            startDate: window.start,
            endDate: window.end,
            status: "RELEASED",
            expiresAt: null,
          })),
        },
      },
    });
    return { booking, subtotalCents, deliveryFeeCents: feeCents, taxCents: tax, totalCents, balanceDueCents, paymentMode };
  }

  let warnings;
  const booking = await prisma.$transaction(
    async (tx) => {
      if (productIds.length > 0) {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "Product" WHERE id IN (${Prisma.join(productIds)}) ORDER BY id FOR UPDATE`
        );
      }

      const now = new Date();
      const [reserved, blackout, dayCount] = await Promise.all([
        reservedByProduct(productIds, window, now, tx),
        blackoutsForWindow(productIds, window, tx),
        bookingsOnDate(eventDate, now, tx),
      ]);

      const atCap = dayCount >= settings.maxBookingsPerDay;
      const shortfalls = [];
      for (const { product, quantity } of demand.values()) {
        const available = blackout.blocked.has(product.id)
          ? 0
          : Math.max(0, product.totalStock - (reserved.get(product.id) ?? 0));
        if (available < quantity) {
          shortfalls.push({
            slug: product.slug,
            name: product.name,
            requested: quantity,
            available,
            stock: product.totalStock,
          });
        }
      }

      const hasConflict = blackout.global || atCap || shortfalls.length > 0;
      if (hasConflict && !force) {
        const err = new HttpError(409, "This date conflicts with existing bookings or availability.");
        err.shortfalls = shortfalls;
        err.blackout = blackout.global;
        err.atCap = atCap;
        throw err;
      }
      if (hasConflict) warnings = { blackout: blackout.global, atCap, shortfalls };

      return tx.booking.create({
        data: {
          ...baseData,
          reservations: {
            create: [...demand.values()].map(({ product, quantity }) => ({
              productId: product.id,
              quantity,
              startDate: window.start,
              endDate: window.end,
              status: "CONFIRMED",
              expiresAt: null,
            })),
          },
        },
      });
    },
    { isolationLevel: "ReadCommitted" }
  );

  return {
    booking,
    subtotalCents,
    deliveryFeeCents: feeCents,
    taxCents: tax,
    totalCents,
    balanceDueCents,
    paymentMode,
    warnings,
  };
}
