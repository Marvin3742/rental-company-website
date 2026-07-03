import { useCallback, useEffect, useState } from "react";
import { listBookings, patchBooking } from "../../lib/admin";
import { formatCents } from "../../lib/format";
import { formatDateLong } from "../../lib/availability";
import { business } from "../../data/content";

const STATUSES = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "EXPIRED"];

// "HH:MM" (24h) → "H:MM AM/PM".
const fmtTime = (t) => {
  if (!/^\d{1,2}:\d{2}$/.test(String(t || ""))) return "—";
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

// ISO timestamp → "Jul 1, 2026, 2:30 PM" (when the booking was placed).
const fmtBookedAt = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function BookingsPanel() {
  const [status, setStatus] = useState(""); // "" = All
  const [city, setCity] = useState(""); // "" = All cities
  const [ref, setRef] = useState(""); // booking reference search
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchingRef = Boolean(ref.trim());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listBookings({ status, city: city.trim(), ref: ref.trim() })
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, city, ref]);

  useEffect(() => {
    // Debounced so typing in the city filter doesn't fire a request per keystroke.
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const replace = (updated) =>
    setBookings((list) => list.map((b) => (b.id === updated.id ? updated : b)));

  return (
    <section className="admin-panel">
      <div className="admin-panel__bar">
        <h2 className="admin-panel__title">Bookings</h2>
        <div className="admin-panel__controls">
          <label>
            Reference{" "}
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="paste booking ref"
            />
          </label>
          {searchingRef && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setRef("")}>
              Clear ref
            </button>
          )}
          <label>
            Status{" "}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={searchingRef}
              title={searchingRef ? "Cleared while searching by reference" : undefined}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || "All"}
                </option>
              ))}
            </select>
          </label>
          <label>
            City{" "}
            <input
              type="text"
              list="admin-city-options"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="All cities"
              disabled={searchingRef}
            />
            <datalist id="admin-city-options">
              {business.serviceAreas.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          {city && !searchingRef && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setCity("")}>
              Clear
            </button>
          )}
          <button type="button" className="admin-btn" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {loading && <p className="admin-muted">Loading…</p>}
      {error && <p className="admin-error">{error}</p>}
      {!loading && !error && bookings.length === 0 && <p className="admin-muted">No bookings.</p>}

      <div className="admin-bookings">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onUpdated={replace} />
        ))}
      </div>
    </section>
  );
}

function BookingCard({ booking: b, onUpdated }) {
  const [editingTimes, setEditingTimes] = useState(false);
  const [dropoff, setDropoff] = useState(b.dropoffLatestTime || "09:00");
  const [pickup, setPickup] = useState(b.pickupEarliestTime || "11:00");
  const [sameDay, setSameDay] = useState(b.pickupSameDay);
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(b.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable (e.g. non-HTTPS) — ignore */
    }
  };

  const act = async (body) => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await patchBooking({ id: b.id, ...body });
      onUpdated(updated);
      setEditingTimes(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const canCancel = !["CANCELLED", "COMPLETED", "EXPIRED"].includes(b.status);

  return (
    <article className="admin-booking">
      <div className="admin-booking__head">
        <div>
          <div className="admin-booking__date">Event: {formatDateLong(b.eventDate)}</div>
          <div className="admin-booking__customer">
            {b.customerName} · {b.customerPhone} · {b.customerEmail}
          </div>
          <div className="admin-booking__booked">Booked {fmtBookedAt(b.createdAt)}</div>
          <div className="admin-booking__ref">
            Ref:{" "}
            <button
              type="button"
              className="admin-booking__ref-btn"
              onClick={copyRef}
              title="Copy booking reference"
            >
              <code>{b.id}</code>
              <span className="admin-booking__ref-action">{copied ? "copied" : "copy"}</span>
            </button>
          </div>
        </div>
        <span className={`admin-status admin-status--${b.status.toLowerCase()}`}>{b.status}</span>
      </div>

      <div className="admin-booking__grid">
        <div>
          <h4>Items</h4>
          <ul className="admin-booking__items">
            {b.lines.map((l, i) => (
              <li key={i}>
                {l.quantity} × {l.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Delivery</h4>
          <address className="admin-booking__address">{b.deliveryAddress}</address>
          <div className="admin-booking__times">
            Drop-off by {fmtTime(b.dropoffLatestTime)}, pickup from {fmtTime(b.pickupEarliestTime)}
            {b.pickupSameDay ? " (same day ok)" : ""}{" "}
            {b.timesConfirmed ? <span className="admin-chip">times confirmed</span> : <span className="admin-chip admin-chip--warn">unconfirmed</span>}
          </div>
        </div>
        <div>
          <h4>Payment</h4>
          <div className="admin-booking__pay">
            {b.paymentMode === "DEPOSIT" ? "Deposit" : "Full"} · total {formatCents(b.totalCents)}
            {b.taxCents ? ` (+${formatCents(b.taxCents)} tax)` : ""}
            <br />
            Paid {formatCents(b.amountPaidCents)}
            {b.balanceDueCents > 0 ? (
              <>
                {" · "}
                <strong>balance due {formatCents(b.balanceDueCents)}</strong>
              </>
            ) : (
              <> · paid in full{b.balanceCollectedMethod ? ` (${b.balanceCollectedMethod})` : ""}</>
            )}
          </div>
        </div>
      </div>

      {err && <p className="admin-error">{err}</p>}

      <div className="admin-booking__actions">
        {!editingTimes ? (
          <button type="button" className="admin-btn" onClick={() => setEditingTimes(true)} disabled={busy}>
            Set / confirm times
          </button>
        ) : (
          <div className="admin-inline">
            <label>
              Drop-off <input type="time" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
            </label>
            <label>
              Pickup <input type="time" value={pickup} onChange={(e) => setPickup(e.target.value)} />
            </label>
            <label className="admin-inline__check">
              <input type="checkbox" checked={sameDay} onChange={(e) => setSameDay(e.target.checked)} /> same-day ok
            </label>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={busy}
              onClick={() =>
                act({ action: "confirmTimes", dropoffLatestTime: dropoff, pickupEarliestTime: pickup, pickupSameDay: sameDay })
              }
            >
              Save
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setEditingTimes(false)}>
              Cancel
            </button>
          </div>
        )}

        {b.balanceDueCents > 0 && (
          <div className="admin-inline">
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="zelle">Zelle</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            <button type="button" className="admin-btn" disabled={busy} onClick={() => act({ action: "recordBalance", method })}>
              Record balance collected
            </button>
          </div>
        )}

        {b.status === "CONFIRMED" && (
          <button type="button" className="admin-btn" disabled={busy} onClick={() => act({ action: "complete" })}>
            Mark completed
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            disabled={busy}
            onClick={() => {
              if (confirm("Cancel this booking and release its inventory?")) act({ action: "cancel" });
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </article>
  );
}
