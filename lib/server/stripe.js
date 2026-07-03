import Stripe from "stripe";

let cached = null;

/** Lazily-constructed Stripe client (uses the account's default API version). */
export function getStripe() {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  cached = new Stripe(key);
  return cached;
}
