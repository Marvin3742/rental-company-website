// Best-effort in-memory rate limiting for the serverless API handlers.
//
// State lives in module memory, so it only spans requests served by the same
// warm function instance — a determined distributed attacker can partially
// evade it via cold starts. That still stops the cheap attacks that matter
// here (credential stuffing against the single admin login, discount-code
// guessing, inventory-hold spam) without adding an external store. If the
// site ever needs hard guarantees, swap this for a KV/Upstash-backed limiter
// behind the same function signature.
import { HttpError } from "./http.js";

const buckets = new Map(); // key -> array of hit timestamps (ms), oldest first

/** Client IP for rate-limit keys. On Vercel, x-forwarded-for is set by the
 * platform (not spoofable by the caller); locally it falls back to the socket. */
export function clientIp(req) {
  const fwd = req.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Sliding-window limiter. Throws HttpError(429) when `key` has been hit more
 * than `max` times in the past `windowMs`.
 */
export function rateLimit(key, { max, windowMs }) {
  const now = Date.now();
  const cutoff = now - windowMs;

  let hits = buckets.get(key);
  if (!hits) {
    hits = [];
    buckets.set(key, hits);
  }
  while (hits.length > 0 && hits[0] <= cutoff) hits.shift();

  if (hits.length >= max) {
    throw new HttpError(429, "Too many requests — please wait a bit and try again.");
  }
  hits.push(now);

  // Bound memory on long-lived instances: drop buckets that have gone idle.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.length === 0 || v[v.length - 1] <= cutoff) buckets.delete(k);
    }
  }
}
