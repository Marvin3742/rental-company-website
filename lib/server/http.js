// Small shared helpers for the serverless API handlers.

/** Throwable error carrying an HTTP status; caught by withApi(). */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Wraps a handler with method routing + uniform error handling.
 * `methods` maps an HTTP verb to an async (req, res) => any. A returned value
 * is sent as JSON (200). Throw HttpError for client errors.
 */
export function withApi(methods) {
  return async function handler(req, res) {
    try {
      const fn = methods[req.method];
      if (!fn) {
        res.setHeader("Allow", Object.keys(methods).join(", "));
        throw new HttpError(405, `Method ${req.method} not allowed`);
      }
      const result = await fn(req, res);
      if (result !== undefined && !res.writableEnded) {
        res.status(200).json(result);
      }
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status >= 500) console.error(err);
      if (!res.writableEnded) {
        // 4xx messages are ours (HttpError) and safe to show. Anything that
        // maps to a 5xx is an unexpected internal error (Prisma, Stripe, fetch…)
        // whose message can leak query/schema/config details — log it, but
        // send the client a generic line.
        const message = status < 500 ? (err.message ?? "Request error") : "Server error";
        res.status(status).json({ error: message });
      }
    }
  };
}
