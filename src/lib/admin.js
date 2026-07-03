// Client for the admin API. Cookies (the auth session) are same-origin, so they
// ride along automatically.
async function req(path, options = {}) {
  const res = await fetch(`/api/admin/${path}`, {
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const adminLogin = (email, password) =>
  req("login", { method: "POST", body: JSON.stringify({ email, password }) });
export const adminLogout = () => req("logout", { method: "POST" });
export const adminMe = () => req("me");

export const listBookings = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return req(`bookings${qs ? `?${qs}` : ""}`);
};
export const patchBooking = (body) => req("bookings", { method: "PATCH", body: JSON.stringify(body) });

export const listProducts = () => req("products");
export const patchProduct = (body) => req("products", { method: "PATCH", body: JSON.stringify(body) });
export const createProduct = (body) => req("products", { method: "POST", body: JSON.stringify(body) });
export const deleteProduct = (id) => req("products", { method: "DELETE", body: JSON.stringify({ id }) });

/** Upload a compressed WebP blob to Blob storage. Returns { url }. */
export async function uploadInventoryImage(blob, name) {
  const res = await fetch(`/api/admin/upload?name=${encodeURIComponent(name || "image")}`, {
    method: "POST",
    headers: { "content-type": "image/webp" },
    credentials: "same-origin",
    body: blob,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Upload failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const listAdminPackages = () => req("packages");
export const createPackage = (body) => req("packages", { method: "POST", body: JSON.stringify(body) });
export const patchPackage = (body) => req("packages", { method: "PATCH", body: JSON.stringify(body) });
export const deletePackage = (id) => req("packages", { method: "DELETE", body: JSON.stringify({ id }) });

export const listBlackouts = () => req("blackouts");
export const createBlackout = (body) => req("blackouts", { method: "POST", body: JSON.stringify(body) });
export const deleteBlackout = (id) => req("blackouts", { method: "DELETE", body: JSON.stringify({ id }) });

/** Per-day inventory state for the calendar. from/to are "YYYY-MM-DD". */
export const getInventoryAvailability = (from, to) =>
  req(`availability?from=${from}&to=${to}`);

export const getAdminSettings = () => req("settings");
export const patchSettings = (body) => req("settings", { method: "PATCH", body: JSON.stringify(body) });
