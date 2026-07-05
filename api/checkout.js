// POST /api/checkout
// Body: { eventDate, lines:[{kind,slug,quantity}], customer:{...}, paymentMode:"FULL"|"DEPOSIT" }
// Creates an oversell-safe hold, then a Stripe Checkout Session. Returns { url, bookingId }.
import { withApi } from "../lib/server/http.js";
import { parseEventDate } from "../lib/server/availability.js";
import { createBookingHold } from "../lib/server/booking.js";
import { getStripe } from "../lib/server/stripe.js";
import { prisma } from "../lib/server/prisma.js";

const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:5173";
const TAX_ENABLED = process.env.STRIPE_TAX_ENABLED === "true";

function buildLineItems(hold) {
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
  // a single lump sum — our own confirmation email still itemizes in full.
  if (hold.discountCents > 0) {
    return [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Solimar Event Rentals — order total (discount applied)" },
          unit_amount: hold.chargeNowCents,
        },
        quantity: 1,
      },
    ];
  }
  const items = hold.displayLines.map((dl) => ({
    price_data: {
      currency: "usd",
      product_data: { name: dl.name },
      unit_amount: dl.unitPriceCents,
    },
    quantity: dl.quantity,
  }));
  if (hold.deliveryFeeCents > 0) {
    items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery & setup" },
        unit_amount: hold.deliveryFeeCents,
      },
      quantity: 1,
    });
  }
  return items;
}

export default withApi({
  async POST(req, res) {
    const { eventDate, lines, customer, paymentMode, discountCode } = req.body ?? {};
    const date = parseEventDate(eventDate);

    let hold;
    try {
      hold = await createBookingHold({ eventDate: date, lines, customer, paymentMode, discountCode });
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
