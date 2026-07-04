import { useEffect, useState } from "react";
import { listProducts, listAdminPackages, createManualBooking } from "../../lib/admin";
import { formatCents } from "../../lib/format";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "zelle", label: "Zelle" },
  { value: "venmo", label: "Venmo" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const dollarsToCents = (v) => Math.round((parseFloat(v || "0") || 0) * 100);

const BLANK_LINE = { kind: "product", slug: "", quantity: "1", priceDollars: "" };

const blankForm = () => ({
  eventDate: todayISO(),
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  pickup: false,
  address: "",
  deliveryFee: "0",
  lines: [{ ...BLANK_LINE }],
  tax: "0",
  amountPaid: "0",
  paymentMethod: "cash",
  status: "CONFIRMED",
  statusTouched: false,
  adminNote: "",
});

/** Admin form for recording a booking made outside checkout (Facebook Marketplace
 * deals, phone bookings) or backfilling a past booking into the system. */
export default function ManualBookingForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([listProducts(), listAdminPackages()])
      .then(([p, pk]) => {
        setProducts(p.filter((x) => x.active));
        setPackages(pk.filter((x) => x.active));
      })
      .catch((e) => setErr(e.message));
  }, [open]);

  const catalogFor = (kind) => (kind === "product" ? products : packages);

  const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const setLine = (i, patch) =>
    setForm((s) => ({ ...s, lines: s.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  const addLine = () => setForm((s) => ({ ...s, lines: [...s.lines, { ...BLANK_LINE }] }));
  const removeLine = (i) => setForm((s) => ({ ...s, lines: s.lines.filter((_, idx) => idx !== i) }));

  const onDateChange = (e) => {
    const eventDate = e.target.value;
    setForm((s) =>
      s.statusTouched
        ? { ...s, eventDate }
        : { ...s, eventDate, status: eventDate < todayISO() ? "COMPLETED" : "CONFIRMED" }
    );
  };
  const onStatusChange = (e) => setForm((s) => ({ ...s, status: e.target.value, statusTouched: true }));

  const onKindChange = (i, e) => setLine(i, { kind: e.target.value, slug: "", priceDollars: "" });
  const onSelectItem = (i, e) => {
    const slug = e.target.value;
    const priceCents = catalogFor(form.lines[i].kind).find((x) => x.slug === slug)?.priceCents;
    setLine(i, { slug, priceDollars: priceCents != null ? (priceCents / 100).toFixed(2) : "" });
  };

  // Live totals — dollars in the UI, converted to cents on submit.
  const subtotalCents = form.lines.reduce(
    (sum, l) => sum + (parseInt(l.quantity, 10) || 0) * dollarsToCents(l.priceDollars),
    0
  );
  const feeCents = form.pickup ? 0 : dollarsToCents(form.deliveryFee);
  const taxCents = dollarsToCents(form.tax);
  const totalCents = subtotalCents + feeCents + taxCents;
  const paidCents = dollarsToCents(form.amountPaid);
  const balanceDueCents = Math.max(0, totalCents - paidCents);

  const buildPayload = (force) => ({
    eventDate: form.eventDate,
    customer: { name: form.customerName, email: form.customerEmail, phone: form.customerPhone },
    delivery: { address: form.pickup ? "" : form.address, feeCents },
    lines: form.lines
      .filter((l) => l.slug && parseInt(l.quantity, 10) > 0)
      .map((l) => ({
        kind: l.kind,
        slug: l.slug,
        quantity: parseInt(l.quantity, 10),
        unitPriceCents: dollarsToCents(l.priceDollars),
      })),
    taxCents,
    amountPaidCents: paidCents,
    paymentMethod: form.paymentMethod,
    status: form.status,
    adminNote: form.adminNote,
    force,
  });

  const submit = async (e, force = false) => {
    e?.preventDefault?.();
    setBusy(true);
    setErr(null);
    if (!force) setConflict(null);
    try {
      const booking = await createManualBooking(buildPayload(force));
      onCreated(booking);
      setForm(blankForm());
      setConflict(null);
      setOpen(false);
    } catch (e2) {
      if (e2.status === 409 && e2.body) {
        setConflict({ message: e2.message, ...e2.body });
      } else {
        setErr(e2.message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="admin-btn admin-btn--primary" onClick={() => setOpen(true)}>
        + Add manual booking
      </button>
    );
  }

  return (
    <form className="admin-additem admin-manual" onSubmit={(e) => submit(e, false)}>
      <div className="admin-manual__head">
        <h3 className="admin-additem__title">Add a manual booking</h3>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <p className="admin-muted">
        For bookings made outside checkout (e.g. Facebook Marketplace) or to backfill a past booking. Past
        event dates skip the availability check entirely.
      </p>

      <div className="admin-additem__grid">
        <label>
          Event date
          <input type="date" value={form.eventDate} onChange={onDateChange} required />
        </label>
        <label>
          Customer name
          <input value={form.customerName} onChange={setField("customerName")} required />
        </label>
        <label>
          Phone
          <input value={form.customerPhone} onChange={setField("customerPhone")} required />
        </label>
        <label>
          Email
          <input type="email" value={form.customerEmail} onChange={setField("customerEmail")} required />
        </label>
      </div>

      <div className="admin-manual__field">
        <label className="admin-inline__check">
          <input
            type="checkbox"
            checked={form.pickup}
            onChange={(e) => setForm((s) => ({ ...s, pickup: e.target.checked }))}
          />
          Pickup (no delivery)
        </label>
      </div>
      {!form.pickup && (
        <div className="admin-additem__grid">
          <label className="admin-additem__wide">
            Delivery address
            <textarea rows={2} value={form.address} onChange={setField("address")} />
          </label>
          <label>
            Delivery fee ($)
            <input type="number" min="0" step="0.01" value={form.deliveryFee} onChange={setField("deliveryFee")} />
          </label>
        </div>
      )}

      <div className="admin-manual__field">
        <span>Items</span>
        <div className="admin-pkg__bom">
          {form.lines.map((l, i) => (
            <div className="admin-pkg__bom-row" key={i}>
              <select value={l.kind} onChange={(e) => onKindChange(i, e)}>
                <option value="product">Product</option>
                <option value="package">Package</option>
              </select>
              <select value={l.slug} onChange={(e) => onSelectItem(i, e)}>
                <option value="">Select item…</option>
                {catalogFor(l.kind).map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                value={l.quantity}
                onChange={(e) => setLine(i, { quantity: e.target.value })}
                aria-label="Quantity"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={l.priceDollars}
                onChange={(e) => setLine(i, { priceDollars: e.target.value })}
                aria-label="Unit price ($)"
                placeholder="Price ($)"
              />
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeLine(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="admin-btn" onClick={addLine}>
            + Add item
          </button>
        </div>
      </div>

      <div className="admin-additem__grid">
        <label>
          Tax ($)
          <input type="number" min="0" step="0.01" value={form.tax} onChange={setField("tax")} />
        </label>
        <label>
          Amount paid ($)
          <input type="number" min="0" step="0.01" value={form.amountPaid} onChange={setField("amountPaid")} />
        </label>
        <label>
          Payment method
          <select value={form.paymentMethod} onChange={setField("paymentMethod")}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={onStatusChange}>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
      </div>

      <label className="admin-manual__field">
        Internal note
        <textarea
          rows={2}
          value={form.adminNote}
          onChange={setField("adminNote")}
          placeholder="e.g. Booked via Facebook Marketplace"
        />
      </label>

      <p className="admin-manual__summary">
        Subtotal {formatCents(subtotalCents)} · Delivery {formatCents(feeCents)} · Tax {formatCents(taxCents)} ·{" "}
        <strong>Total {formatCents(totalCents)}</strong> · Paid {formatCents(paidCents)}
        {balanceDueCents > 0
          ? ` · Balance due ${formatCents(balanceDueCents)}`
          : " · Paid in full"}
      </p>

      {err && <p className="admin-error">{err}</p>}

      {conflict && (
        <div className="admin-error admin-manual__conflict">
          <p>{conflict.message}</p>
          {conflict.blackout && <p>This date is blacked out.</p>}
          {conflict.atCap && <p>This date is already at the daily delivery cap.</p>}
          {conflict.shortfalls?.length > 0 && (
            <ul>
              {conflict.shortfalls.map((s) => (
                <li key={s.slug}>
                  {s.name}: requested {s.requested}, only {s.available} available (stock {s.stock})
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            disabled={busy}
            onClick={(e) => submit(e, true)}
          >
            Create anyway
          </button>
        </div>
      )}

      <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
        {busy ? "Creating…" : "Create manual booking"}
      </button>
    </form>
  );
}
