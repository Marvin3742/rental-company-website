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
        res.status(status).json({ error: err.message ?? "Server error" });
      }
    }
  };
}
