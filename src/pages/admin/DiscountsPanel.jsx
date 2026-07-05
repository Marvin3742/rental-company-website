import { useCallback, useEffect, useState } from "react";
import { listDiscounts, createDiscount, deleteDiscount } from "../../lib/admin";
import { formatCents } from "../../lib/format";
import { formatDateLong } from "../../lib/availability";

const BLANK = { kind: "PERCENT", value: "", note: "" };

const describe = (d) => (d.kind === "PERCENT" ? `${d.value}% off` : `${formatCents(d.value)} off`);

export default function DiscountsPanel() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [justCreated, setJustCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    listDiscounts().then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setJustCreated(null);
    try {
      const value = form.kind === "PERCENT" ? parseInt(form.value, 10) : Math.round(parseFloat(form.value || "0") * 100);
      const created = await createDiscount({ kind: form.kind, value, note: form.note.trim() || undefined });
      setJustCreated(created);
      setForm(BLANK);
      setRows((list) => [created, ...list]);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this unused discount code?")) return;
    try {
      await deleteDiscount(id);
      setRows((list) => list.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Discounts</h2>
      <p className="admin-muted">
        Generate a one-time code for friends &amp; family — it can be redeemed once at checkout, then it's spent.
      </p>
      {error && <p className="admin-error">{error}</p>}

      <form className="admin-additem" onSubmit={generate}>
        <h3 className="admin-additem__title">Generate a code</h3>
        <div className="admin-additem__grid">
          <label>
            Type
            <select value={form.kind} onChange={set("kind")}>
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Fixed amount off</option>
            </select>
          </label>
          <label>
            {form.kind === "PERCENT" ? "Percent (1-100)" : "Amount ($)"}
            <input
              type="number"
              min={form.kind === "PERCENT" ? 1 : 0.01}
              max={form.kind === "PERCENT" ? 100 : undefined}
              step={form.kind === "PERCENT" ? 1 : 0.01}
              value={form.value}
              onChange={set("value")}
              required
            />
          </label>
          <label className="admin-additem__wide">
            Note (optional)
            <input type="text" value={form.note} onChange={set("note")} placeholder="e.g. Cousin Maria's birthday" />
          </label>
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? "Generating…" : "Generate code"}
        </button>
      </form>

      {justCreated && (
        <div className="admin-discount-created">
          <span>Code generated:</span>
          <button type="button" className="admin-discount-created__code" onClick={() => copyCode(justCreated.code)}>
            <code>{justCreated.code}</code>
            <span className="admin-discount-created__action">{copied ? "copied" : "copy"}</span>
          </button>
          <span className="admin-muted">{describe(justCreated)} — share this with them however you like.</span>
        </div>
      )}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Note</th>
              <th>Status</th>
              <th>Redeemed by</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-muted">
                  No discount codes yet.
                </td>
              </tr>
            )}
            {rows.map((d) => (
              <tr key={d.id}>
                <td>
                  <code>{d.code}</code>
                </td>
                <td>{describe(d)}</td>
                <td className="admin-muted">{d.note || "—"}</td>
                <td>
                  {d.usedAt ? (
                    <span className="admin-chip">Used</span>
                  ) : (
                    <span className="admin-chip admin-chip--warn">Available</span>
                  )}
                </td>
                <td className="admin-muted">
                  {d.usedByBooking
                    ? `${d.usedByBooking.customerName} · ${formatDateLong(d.usedByBooking.eventDate)}`
                    : "—"}
                </td>
                <td>
                  {!d.usedAt && (
                    <button type="button" className="admin-btn admin-btn--danger" onClick={() => remove(d.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
