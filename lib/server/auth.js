// Admin auth: signed httpOnly JWT cookie for the single owner login.
import jwt from "jsonwebtoken";
import { HttpError } from "./http.js";

const COOKIE_NAME = "solimar_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export function signAdminToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: MAX_AGE_SECONDS });
}

function parseCookies(req) {
  const header = req.headers?.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k) out[k] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function setAuthCookie(res, token) {
  const attrs = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") attrs.push("Secure");
  res.setHeader("Set-Cookie", attrs.join("; "));
}

export function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

/** Throws HttpError(401) if the request has no valid admin session. Returns the token payload. */
export function requireAdmin(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) throw new HttpError(401, "Not authenticated");
  try {
    return jwt.verify(token, getSecret());
  } catch {
    throw new HttpError(401, "Session expired");
  }
}
