export function formatPrice(value) {
  return `$${value.toLocaleString("en-US")}`;
}

// Cents-aware money formatter for cart/checkout totals (always 2 decimals).
export function formatCents(cents) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPhone(phone) {
  // Accepts "239-555-0100" or "2395550100" → "(239) 555-0100"
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return phone;
}

export function telHref(phone) {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}

export function mailtoHref(email, subject) {
  const q = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${email}${q}`;
}
