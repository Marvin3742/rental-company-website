// Single entry point for most /api/admin/* routes, consolidated into one
// serverless function to stay under Vercel Hobby's 12-function limit.
// api/admin/upload.js stays separate — it needs the raw request body
// (bodyParser disabled), which can't be mixed with the JSON-parsed routes here.
import availability from "../../lib/server/admin/availability.js";
import blackouts from "../../lib/server/admin/blackouts.js";
import bookings from "../../lib/server/admin/bookings.js";
import login from "../../lib/server/admin/login.js";
import logout from "../../lib/server/admin/logout.js";
import me from "../../lib/server/admin/me.js";
import packages from "../../lib/server/admin/packages.js";
import products from "../../lib/server/admin/products.js";
import settings from "../../lib/server/admin/settings.js";

const routes = { availability, blackouts, bookings, login, logout, me, packages, products, settings };

export default async function handler(req, res) {
  const fn = routes[req.query.route];
  if (!fn) return res.status(404).json({ error: "Not found" });
  return fn(req, res);
}
