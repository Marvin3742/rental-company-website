// POST /api/webhooks/stripe — Stripe event receiver.
// Verifies the signature against the RAW body (bodyParser disabled), then
// confirms or expires the booking idempotently.
import { getStripe } from "../../lib/server/stripe.js";
import { prisma } from "../../lib/server/prisma.js";
import { sendBookingEmails } from "../../lib/server/email.js";
import { releaseDiscountCode } from "../../lib/server/discounts.js";

// Vercel: do not parse the body, so we can verify the Stripe signature.
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  if (req.rawBody) return req.rawBody; // provided by the dev plugin
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: "Webhook secret not configured" });

  let event;
  try {
    const raw = await getRawBody(req);
    const sig = req.headers["stripe-signature"];
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await confirmBooking(event.data.object);
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      await expireBooking(event.data.object);
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Handler error" });
  }
}

async function confirmBooking(session) {
  const bookingId = session.metadata?.bookingId || session.client_reference_id;
  if (!bookingId) return;

  // Only confirm sessions Stripe says are actually paid. Async payment methods
  // (ACH & co.) fire checkout.session.completed with payment_status "unpaid";
  // the money arrives later via checkout.session.async_payment_succeeded.
  if (session.payment_status !== "paid") return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;
  // Idempotency + state guard: PENDING is the normal path; EXPIRED can still
  // confirm (payment landed after the hold-release cron). Anything else —
  // UPCOMING (already confirmed), COMPLETED, CANCELLED — must never be
  // overwritten by a redelivered or late webhook event.
  if (booking.status !== "PENDING" && booking.status !== "EXPIRED") return;

  const amountPaid = session.amount_total ?? 0;
  const taxCents = session.total_details?.amount_tax ?? 0;
  const grand = booking.totalCents + taxCents;
  const balanceDue = booking.paymentMode === "DEPOSIT" ? Math.max(0, grand - amountPaid) : 0;

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "UPCOMING",
        confirmedAt: new Date(),
        holdExpiresAt: null,
        amountPaidCents: amountPaid,
        taxCents,
        balanceDueCents: balanceDue,
        stripePaymentIntent:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    }),
    prisma.reservation.updateMany({
      where: { bookingId },
      data: { status: "CONFIRMED", expiresAt: null },
    }),
  ]);

  // Best-effort emails — never fail the webhook if email has an issue.
  try {
    const full = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { lines: { include: { product: true, package: true } } },
    });
    await sendBookingEmails(full);
  } catch (err) {
    console.error("[email] booking emails failed:", err);
  }
}

async function expireBooking(session) {
  const bookingId = session.metadata?.bookingId || session.client_reference_id;
  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "EXPIRED", holdExpiresAt: null },
    });
    await tx.reservation.updateMany({
      where: { bookingId },
      data: { status: "RELEASED", expiresAt: null },
    });
    await releaseDiscountCode(bookingId, tx);
  });
}
