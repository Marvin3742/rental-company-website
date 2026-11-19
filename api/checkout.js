// POST /api/checkout
// Body: { eventDate, lines:[{kind,slug,quantity}], customer:{...}, paymentMode:"FULL"|"DEPOSIT"|"RESERVE",
//         discountCode?, clickId?:{type:"gclid"|"gbraid"|"wbraid",value} }
// Creates an oversell-safe hold, then a Stripe Checkout Session. Returns { url, bookingId }.
// RESERVE (offered while deposits are off) skips Stripe: the booking is confirmed
// on the spot and `url` points straight at the success page.
import { withApi } from "../lib/server/http.js";
import { parseEventDate } from "../lib/server/availability.js";
import { createBookingHold } from "../lib/server/booking.js";
import { getStripe } from "../lib/server/stripe.js";
import { prisma } from "../lib/server/prisma.js";
import { rateLimit, clientIp } from "../lib/server/rate-limit.js";
import { sendBookingEmails } from "../lib/server/email.js";

const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:5173";
const TAX_ENABLED = process.env.STRIPE_TAX_ENABLED === "true";

const lineItem = (name, cents) => ({
  price_data: { currency: "usd", product_data: { name }, unit_amount: cents },
  quantity: 1,
});

function buildLineItems(hold) {
  // The deposit is a share of the whole total (small-order fee included), so it
  // stays one line.
  if (hold.paymentMode === "DEPOSIT") {
    return [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Deposit (${hold.depositPct}%) — Solimar Event Rentals` },
          unit_amount: hold.chargeNowCents,
        },
        quantity: 1,
      },
    ];
  }
  // A discount is already folded into hold.totalCents by createBookingHold, so
  // the itemized per-product prices below no longer sum to the actual charge.
  // Rather than pull in Stripe's own Coupon API to reconcile that, just charge
  // a single lump sum — our own confirmation email still itemizes in full. The
  // small-order fee isn't discountable, so it keeps its own line.
  if (hold.discountCents > 0) {
    const items = [
      lineItem("Solimar Event Rentals — order total (discount applied)", hold.chargeNowCents - hold.smallOrderFeeCents),
    ];
    if (hold.smallOrderFeeCents > 0) items.push(lineItem("Small order fee", hold.smallOrderFeeCents));
    return items;
  }
  const items = hold.displayLines.map((dl) => ({
    price_data: {
      currency: "usd",
      product_data: { name: dl.name },
      unit_amount: dl.unitPriceCents,
    },
    quantity: dl.quantity,
  }));
  if (hold.deliveryFeeCents > 0) items.push(lineItem("Delivery & setup", hold.deliveryFeeCents));
  if (hold.smallOrderFeeCents > 0) items.push(lineItem("Small order fee", hold.smallOrderFeeCents));
  return items;
}

export default withApi({
  async POST(req, res) {
    // Every accepted request creates a 32-minute inventory hold (which also
    // counts toward the daily booking cap), so unthrottled spam could lock up
    // the calendar with fake holds. 15/10min is far above any real customer.
    rateLimit(`checkout:${clientIp(req)}`, { max: 15, windowMs: 10 * 60 * 1000 });

    const { eventDate, lines, customer, paymentMode, discountCode, clickId } = req.body ?? {};
    // A reservation keeps its inventory until the owner cancels it (nothing paid,
    // no expiry), so allow far fewer of those per IP than 32-minute holds.
    if (paymentMode === "RESERVE") rateLimit(`reserve:${clientIp(req)}`, { max: 5, windowMs: 60 * 60 * 1000 });
    const date = parseEventDate(eventDate);

    let hold;
    try {
      hold = await createBookingHold({ eventDate: date, lines, customer, paymentMode, discountCode, clickId });
    } catch (err) {
      if (err.shortfalls) {
        // Names only — don't leak available/stock counts to the client.
        res.status(409).json({
          error: err.message,
          shortfalls: err.shortfalls.map((s) => ({ name: s.name })),
        });
        return; // already sent; withApi won't resend
      }
      throw err;
    }

    const { booking } = hold;

    // Reservation: already confirmed, nothing to collect online. Send the emails
    // the Stripe webhook would have sent (best-effort) and skip Stripe entirely.
    if (hold.paymentMode === "RESERVE") {
      try {
        const full = await prisma.booking.findUnique({
          where: { id: booking.id },
          include: { lines: { include: { product: true, package: true } } },
        });
        await sendBookingEmails(full);
      } catch (err) {
        console.error("[email] booking emails failed:", err);
      }
      return { url: `/booking/success?b=${booking.id}`, bookingId: booking.id };
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: buildLineItems(hold),
      customer_email: booking.customerEmail,
      client_reference_id: booking.id,
      metadata: { bookingId: booking.id, paymentMode: hold.paymentMode },
      success_url: `${SITE_URL}/booking/success?b=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/booking/cancelled?b=${booking.id}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      ...(TAX_ENABLED ? { automatic_tax: { enabled: true }, billing_address_collection: "required" } : {}),
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    return { url: session.url, bookingId: booking.id };
  },
});
