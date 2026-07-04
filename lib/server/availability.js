// Availability engine — the single source of truth for "can this be booked?".
// Two scarce resources are enforced: (1) per-product stock and (2) the single
// delivery team's daily capacity. Packages are exploded into their component
// products via the bill-of-materials, so the engine only ever reasons about products.
//
// A booking for event date D reserves its products over [D, D + bufferDays] (the
// next-day-pickup turnaround). Availability counts CONFIRMED reservations plus HELD
// reservations whose hold has not yet expired, so reads are correct even before the
// expired-hold cron runs.

import { prisma } from "./prisma.js";
import { HttpError } from "./http.js";

const DEFAULT_SETTINGS = {
  maxBookingsPerDay: 3,
  depositPct: 30,
  bufferDays: 1,
  deliveryFeeCents: 0,
};

// ─── Date helpers (UTC, day-granular to match @db.Date) ───────────────────────

/** "YYYY-MM-DD" → Date at UTC midnight. Throws HttpError on bad input. */
export function parseEventDate(dateStr) {
  if (typeof dateStr !== "string") throw new HttpError(400, "eventDate is required");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) throw new HttpError(400, `Invalid date "${dateStr}" (expected YYYY-MM-DD)`);
  const [, y, mo, d] = m.map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `Invalid date "${dateStr}"`);
  return date;
}

/** Date → "YYYY-MM-DD" (UTC). */
export function ymd(date) {
  return date.toISOString().slice(0, 10);
}

/** Reservation window [start, end] for an event date, inclusive of the buffer tail. */
export function reservationWindow(eventDate, bufferDays) {
  const end = new Date(eventDate);
  end.setUTCDate(end.getUTCDate() + bufferDays);
  return { start: eventDate, end };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(client = prisma) {
  const s = await client.setting.findUnique({ where: { id: "singleton" } });
  return s ?? DEFAULT_SETTINGS;
}

// ─── Core queries ───────────────────────────────────────────────────────────

/** Filter selecting reservations that currently consume stock. */
function activeReservationWhere(now) {
  return {
    OR: [{ status: "CONFIRMED" }, { status: "HELD", expiresAt: { gt: now } }],
  };
}

/**
 * Explode a cart into per-product demand.
 * @param lines [{ kind: 'product'|'package', slug, quantity }]
 * @returns Map<productId, { product, quantity }>
 */
export async function explodeDemand(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new HttpError(400, "lines must be a non-empty array");
  }
  const productSlugs = [];
  const packageSlugs = [];
  for (const line of lines) {
    const qty = Number(line?.quantity);
    if (!line?.slug || !Number.isInteger(qty) || qty <= 0) {
      throw new HttpError(400, `Invalid line: ${JSON.stringify(line)}`);
    }
    if (line.kind === "product") productSlugs.push(line.slug);
    else if (line.kind === "package") packageSlugs.push(line.slug);
    else throw new HttpError(400, `Unknown line kind "${line.kind}"`);
  }

  const [products, packages] = await Promise.all([
    prisma.product.findMany({ where: { slug: { in: productSlugs } } }),
    prisma.package.findMany({
      where: { slug: { in: packageSlugs } },
      include: { items: { include: { product: true } } },
    }),
  ]);
  const productBySlug = new Map(products.map((p) => [p.slug, p]));
  const packageBySlug = new Map(packages.map((p) => [p.slug, p]));

  const demand = new Map();
  const add = (product, qty) => {
    const cur = demand.get(product.id) ?? { product, quantity: 0 };
    cur.quantity += qty;
    demand.set(product.id, cur);
  };

  for (const line of lines) {
    if (line.kind === "product") {
      const p = productBySlug.get(line.slug);
      if (!p) throw new HttpError(400, `Unknown product "${line.slug}"`);
      add(p, line.quantity);
    } else {
      const pk = packageBySlug.get(line.slug);
      if (!pk) throw new HttpError(400, `Unknown package "${line.slug}"`);
      for (const item of pk.items) add(item.product, item.quantity * line.quantity);
    }
  }
  return demand;
}

/** Sum of active reserved quantity per product over a window. Map<productId, number>. */
export async function reservedByProduct(productIds, window, now = new Date(), client = prisma) {
  if (productIds.length === 0) return new Map();
  const rows = await client.reservation.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      startDate: { lte: window.end },
      endDate: { gte: window.start },
      ...activeReservationWhere(now),
    },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.productId, r._sum.quantity ?? 0]));
}

/** Blackouts overlapping a window. Global (productId null) blocks the whole day. */
export async function blackoutsForWindow(productIds, window, client = prisma) {
  const rows = await client.blackout.findMany({
    where: {
      startDate: { lte: window.end },
      endDate: { gte: window.start },
      OR: [{ productId: null }, { productId: { in: productIds } }],
    },
    select: { productId: true },
  });
  let global = false;
  const blocked = new Set();
  for (const b of rows) {
    if (b.productId === null) global = true;
    else blocked.add(b.productId);
  }
  return { global, blocked };
}

/** Count active bookings (upcoming or unexpired holds) for a delivery date. */
export async function bookingsOnDate(eventDate, now = new Date(), client = prisma) {
  return client.booking.count({
    where: {
      eventDate,
      OR: [{ status: "UPCOMING" }, { status: "PENDING", holdExpiresAt: { gt: now } }],
    },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether a specific cart can be booked on a date.
 * @param eventDate Date (UTC midnight)
 * @param lines cart lines (see explodeDemand)
 */
export async function checkAvailability({ eventDate, lines }) {
  const now = new Date();
  const settings = await getSettings();
  const window = reservationWindow(eventDate, settings.bufferDays);
  const demand = await explodeDemand(lines);
  const productIds = [...demand.keys()];

  const [reserved, blackout, dayCount] = await Promise.all([
    reservedByProduct(productIds, window, now),
    blackoutsForWindow(productIds, window),
    bookingsOnDate(eventDate, now),
  ]);

  const underDailyCap = dayCount < settings.maxBookingsPerDay;
  const dayBookable = !blackout.global && underDailyCap;

  const lineResults = [...demand.values()].map(({ product, quantity }) => {
    const blackedOut = blackout.blocked.has(product.id);
    const available = blackedOut
      ? 0
      : Math.max(0, product.totalStock - (reserved.get(product.id) ?? 0));
    return {
      slug: product.slug,
      name: product.name,
      requested: quantity,
      available,
      stock: product.totalStock,
      ok: !blackedOut && available >= quantity,
    };
  });

  return {
    date: ymd(eventDate),
    bookable: dayBookable && lineResults.every((l) => l.ok),
    dayBookable,
    underDailyCap,
    globalBlackout: blackout.global,
    bookingsOnDate: dayCount,
    maxBookingsPerDay: settings.maxBookingsPerDay,
    lines: lineResults,
  };
}

/**
 * Availability for the entire active catalog on a date — used to badge cards.
 * Returns max bookable quantity per product, and per package (limited by its
 * scarcest component).
 */
export async function getCatalogAvailability(eventDate) {
  const now = new Date();
  const settings = await getSettings();
  const window = reservationWindow(eventDate, settings.bufferDays);

  const products = await prisma.product.findMany({ where: { active: true } });
  const productIds = products.map((p) => p.id);

  const [reserved, blackout, dayCount] = await Promise.all([
    reservedByProduct(productIds, window, now),
    blackoutsForWindow(productIds, window),
    bookingsOnDate(eventDate, now),
  ]);

  const dayBookable = !blackout.global && dayCount < settings.maxBookingsPerDay;

  const availById = new Map();
  const productsBySlug = {};
  for (const p of products) {
    const available = blackout.blocked.has(p.id)
      ? 0
      : Math.max(0, p.totalStock - (reserved.get(p.id) ?? 0));
    availById.set(p.id, available);
    productsBySlug[p.slug] = { available, stock: p.totalStock };
  }

  const packages = await prisma.package.findMany({
    where: { active: true },
    include: { items: true },
  });
  const packagesBySlug = {};
  for (const pk of packages) {
    let maxSets = pk.items.length === 0 ? 0 : Infinity;
    for (const item of pk.items) {
      maxSets = Math.min(maxSets, Math.floor((availById.get(item.productId) ?? 0) / item.quantity));
    }
    packagesBySlug[pk.slug] = { available: Number.isFinite(maxSets) ? maxSets : 0 };
  }

  return {
    date: ymd(eventDate),
    dayBookable,
    bookingsOnDate: dayCount,
    maxBookingsPerDay: settings.maxBookingsPerDay,
    globalBlackout: blackout.global,
    products: productsBySlug,
    packages: packagesBySlug,
  };
}
