import { useCallback, useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { listBookings, patchBooking } from "../../lib/admin";
import { formatCents } from "../../lib/format";
import { formatDateLong, toISODate } from "../../lib/availability";
import { business } from "../../data/content";
import ManualBookingForm from "./ManualBookingForm";

/** "YYYY-MM-DD" → local Date at midnight (matches how the checkout picker works). */
const isoToLocalDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

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
  const [selectedDay, setSelectedDay] = useState(undefined); // calendar day filter

  const searchingRef = Boolean(ref.trim());

  // Dates that have at least one booking, for highlighting on the calendar.
  const bookedDates = useMemo(
    () =>
      [...new Set(bookings.map((b) => b.eventDate).filter(Boolean))].map(
        isoToLocalDate
      ),
    [bookings]
  );

  const selectedISO = selectedDay ? toISODate(selectedDay) : "";
  const visibleBookings = selectedISO
    ? bookings.filter((b) => b.eventDate === selectedISO)
    : bookings;

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

  const addManual = (created) => setBookings((list) => [created, ...list]);

  return (
    <section className="admin-panel">
      <ManualBookingForm onCreated={addManual} />

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

      <div className="admin-bookings-layout">
        <div className="admin-bookings-main">
          {loading && <p className="admin-muted">Loading…</p>}
          {error && <p className="admin-error">{error}</p>}
          {!loading && !error && bookings.length === 0 && (
            <p className="admin-muted">No bookings.</p>
          )}
          {!loading && !error && bookings.length > 0 && visibleBookings.length === 0 && (
            <p className="admin-muted">No bookings on {formatDateLong(selectedISO)}.</p>
          )}

          <div className="admin-bookings">
            {visibleBookings.map((b) => (
              <BookingCard key={b.id} booking={b} onUpdated={replace} />
            ))}
          </div>
        </div>

        <aside className="admin-cal">
          <h3 className="admin-cal__title">Calendar</h3>
          <DayPicker
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            modifiers={{ booked: bookedDates }}
            modifiersClassNames={{ booked: "admin-cal__booked" }}
            weekStartsOn={0}
          />
          {selectedISO ? (
            <div className="admin-cal__selected">
              <span>
                Showing {formatDateLong(selectedISO)}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => setSelectedDay(undefined)}
              >
                Show all dates
              </button>
            </div>
          ) : (
            <p className="admin-cal__legend">
              <span className="admin-cal__legend-swatch" aria-hidden="true" />
              Dates with bookings
            </p>
          )}
        </aside>
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
  const [note, setNote] = useState(b.adminNote || "");
  const [noteSaved, setNoteSaved] = useState(false);

  const noteDirty = note.trim() !== (b.adminNote || "");

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

  const saveNote = async () => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await patchBooking({ id: b.id, action: "saveNote", note });
      onUpdated(updated);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1400);
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
        <div className="admin-booking__badges">
          {b.source === "MANUAL" && <span className="admin-chip admin-chip--manual">Manual</span>}
          <span className={`admin-status admin-status--${b.status.toLowerCase()}`}>{b.status}</span>
        </div>
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
            {/* Web bookings: totalCents excludes tax (tax is bolted on by the Stripe webhook).
                Manual bookings: tax is folded into totalCents up front — don't double-count it. */}
            {b.source === "WEB" && b.taxCents ? ` (+${formatCents(b.taxCents)} tax)` : ""}
            <br />
            Paid {formatCents(b.amountPaidCents)}
            {b.paymentMethod ? ` (${b.paymentMethod})` : ""}
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

      <div className="admin-booking__note">
        <label htmlFor={`note-${b.id}`}>Internal note</label>
        <textarea
          id={`note-${b.id}`}
          className="admin-booking__note-input"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder=""
        />
        <div className="admin-booking__note-actions">
          <button type="button" className="admin-btn" disabled={busy || !noteDirty} onClick={saveNote}>
            {noteDirty ? "Save note" : "Saved"}
          </button>
          {noteSaved && <span className="admin-chip">saved</span>}
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
