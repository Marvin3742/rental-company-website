// Transactional emails via Resend: customer confirmation + owner new-booking alert.
// Safe to call without RESEND_API_KEY (it just logs and skips), so the webhook
// never fails because of email.
import { Resend } from "resend";
import { business } from "../../src/data/content.js";

const FROM = process.env.EMAIL_FROM || "Solimar Event Rentals <onboarding@resend.dev>";
const OWNER = process.env.OWNER_NOTIFY_EMAIL || business.email;
const SITE_URL = process.env.VITE_SITE_URL || "https://solimareventrentals.com";
const ACCENT = "#1d4ed8"; // brand blue — matches --color-accent in src/styles/tokens.css
const LOGO_URL = `${SITE_URL}/images/solimar-logo-email.png`; // PNG, not the site's .webp — broader email-client support

let cached = null;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// "HH:MM" (24h) → "H:MM AM/PM". Falls back to a dash for empty/invalid.
const fmtTime = (t) => {
  if (!/^\d{1,2}:\d{2}$/.test(String(t || ""))) return "—";
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

function lineRows(lines) {
  return (lines || [])
    .map((l) => {
      const name = l.product?.name ?? l.package?.name ?? l.lineType;
      return `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee;">${l.quantity} × ${esc(name)}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">${dollars(l.unitPriceCents * l.quantity)}</td>
      </tr>`;
    })
    .join("");
}

function totalsRows(b) {
  const rows = [`<tr><td>Subtotal</td><td style="text-align:right;">${dollars(b.subtotalCents)}</td></tr>`];
  rows.push(
    `<tr><td>Delivery</td><td style="text-align:right;">${b.deliveryFeeCents ? dollars(b.deliveryFeeCents) : "FREE"}</td></tr>`
  );
  if (b.taxCents) rows.push(`<tr><td>Tax</td><td style="text-align:right;">${dollars(b.taxCents)}</td></tr>`);
  rows.push(
    `<tr><td style="font-weight:700;padding-top:6px;">Total</td><td style="text-align:right;font-weight:700;padding-top:6px;">${dollars(
      b.totalCents + (b.taxCents || 0)
    )}</td></tr>`
  );
  rows.push(`<tr><td>Paid today</td><td style="text-align:right;">${dollars(b.amountPaidCents)}</td></tr>`);
  if (b.balanceDueCents > 0)
    rows.push(
      `<tr><td style="color:#a3261f;font-weight:700;">Balance due on delivery</td><td style="text-align:right;color:#a3261f;font-weight:700;">${dollars(
        b.balanceDueCents
      )}</td></tr>`
    );
  return rows.join("");
}

function shell(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#142033;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff5e6;border:1px solid #cdd9ec;border-bottom:none;padding:24px 20px 20px;text-align:center;">
      <img src="${LOGO_URL}" width="140" alt="${esc(business.name)}" style="display:block;margin:0 auto;max-width:140px;height:auto;">
    </div>
    <div style="background:#fff;border:1px solid #cdd9ec;border-top:none;padding:24px 20px;">
      <h1 style="font-size:20px;margin:0 0 16px;color:${ACCENT};">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#7b8aa0;font-size:12px;margin:16px 4px;">
      ${esc(business.name)} · ${esc(business.phone)} · ${esc(business.email)}<br>
      Serving ${business.serviceAreas.map(esc).join(", ")}
    </p>
  </div></body></html>`;
}

const table = (inner) => `<table width="100%" style="border-collapse:collapse;font-size:14px;margin:8px 0;">${inner}</table>`;
const sectionTitle = (text) =>
  `<h3 style="font-size:14px;margin:18px 0 4px;color:${ACCENT};">${text}</h3>`;

export function buildCustomerEmail(b) {
  const body = `
    <p>Hi ${esc(b.customerName)}, your rentals are reserved for <strong>${fmtDate(b.eventDate)}</strong>.</p>
    <p style="background:#e7edf6;padding:10px 12px;">We'll call you soon to confirm your exact delivery and pickup times.</p>
    ${sectionTitle("Your items")}
    ${table(lineRows(b.lines))}
    ${sectionTitle("Payment")}
    ${table(totalsRows(b))}
    ${sectionTitle("Delivery to")}
    <p style="white-space:pre-line;margin:0;">${esc(b.deliveryAddress)}</p>
    <p style="margin-top:8px;font-size:13px;color:#475569;">Preferred: drop-off by ${fmtTime(
      b.dropoffLatestTime
    )}, pickup from ${fmtTime(b.pickupEarliestTime)}${b.pickupSameDay ? " (same-day OK)" : ""}.</p>
    <p style="color:#7b8aa0;font-size:12px;margin-top:20px;">Booking reference: ${esc(b.id)}</p>`;
  return { subject: `Booking confirmed — ${fmtDate(b.eventDate)}`, html: shell("Your booking is confirmed.", body) };
}

export function buildOwnerEmail(b) {
  const body = `
    <p><strong>New ${b.paymentMode === "DEPOSIT" ? "deposit" : "full-payment"} booking</strong> for <strong>${fmtDate(
      b.eventDate
    )}</strong>.</p>
    <p style="background:#fdf3da;padding:10px 12px;">Call ${esc(b.customerPhone)} to confirm delivery/pickup times.</p>
    ${sectionTitle("Customer")}
    <p style="margin:0;">${esc(b.customerName)}<br>${esc(b.customerPhone)} · ${esc(b.customerEmail)}</p>
    ${sectionTitle("Deliver to")}
    <p style="white-space:pre-line;margin:0;">${esc(b.deliveryAddress)}</p>
    <p style="margin-top:6px;font-size:13px;color:#475569;">Drop-off by ${fmtTime(b.dropoffLatestTime)}, pickup from ${fmtTime(
      b.pickupEarliestTime
    )}${b.pickupSameDay ? " (same-day OK)" : ""}.</p>
    ${sectionTitle("Items")}
    ${table(lineRows(b.lines))}
    ${sectionTitle("Payment")}
    ${table(totalsRows(b))}
    <p style="margin-top:20px;"><a href="${SITE_URL}/admin" style="background:${ACCENT};color:#fff;padding:10px 16px;text-decoration:none;">Open admin dashboard</a></p>`;
  return { subject: `New booking — ${fmtDate(b.eventDate)} — ${b.customerName}`, html: shell("New booking", body) };
}

/**
 * Send ONLY the customer confirmation email — used by the admin "resend
 * confirmation" action. Unlike sendBookingEmails (best-effort, never throws),
 * this THROWS on failure so the admin sees whether it actually went out.
 * `booking` must include lines (with product/package relations).
 */
export async function sendCustomerConfirmation(booking) {
  const resend = getResend();
  if (!resend) throw new Error("Email is not configured (RESEND_API_KEY missing).");
  const { subject, html } = buildCustomerEmail(booking);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: booking.customerEmail,
    subject,
    html,
  });
  if (error) throw new Error(error.message || "Email provider rejected the send.");
  return data;
}

/** Send both emails for a confirmed booking (best-effort). `booking` must include lines. */
export async function sendBookingEmails(booking) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping booking emails");
    return;
  }
  const customer = buildCustomerEmail(booking);
  const owner = buildOwnerEmail(booking);
  const tasks = [
    resend.emails.send({ from: FROM, to: booking.customerEmail, subject: customer.subject, html: customer.html }),
  ];
  if (OWNER) {
    tasks.push(resend.emails.send({ from: FROM, to: OWNER, subject: owner.subject, html: owner.html }));
  }
  const results = await Promise.allSettled(tasks);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[email] send #${i} failed:`, r.reason);
    else if (r.value?.error) console.error(`[email] send #${i} error:`, r.value.error);
  });
}
