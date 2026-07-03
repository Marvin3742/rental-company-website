import { useCallback, useEffect, useState } from "react";
import { listBlackouts, createBlackout, deleteBlackout, listProducts } from "../../lib/admin";

export default function BlackoutsPanel() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ productSlug: "", startDate: "", endDate: "", reason: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listBlackouts().then(setRows).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    listProducts().then(setProducts).catch(() => {});
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createBlackout({
        productSlug: form.productSlug || undefined,
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        reason: form.reason,
      });
      setForm({ productSlug: "", startDate: "", endDate: "", reason: "" });
      load();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this blackout?")) return;
    await deleteBlackout(id).catch((e) => setError(e.message));
    load();
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Blackout dates</h2>
      <p className="admin-muted">Block a day for everything (holiday, day off) or a single item (repair). Blocked dates disappear from customer availability.</p>
      {error && <p className="admin-error">{error}</p>}

      <form className="admin-blackout-form" onSubmit={add}>
        <label>
          Item
          <select value={form.productSlug} onChange={set("productSlug")}>
            <option value="">All items (whole day)</option>
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start
          <input type="date" value={form.startDate} onChange={set("startDate")} required />
        </label>
        <label>
          End
          <input type="date" value={form.endDate} onChange={set("endDate")} />
        </label>
        <label className="admin-blackout-form__reason">
          Reason
          <input type="text" value={form.reason} onChange={set("reason")} placeholder="optional" />
        </label>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          Add
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>From</th>
            <th>To</th>
            <th>Reason</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="admin-muted">
                No blackout dates.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.productName}</td>
              <td>{r.startDate}</td>
              <td>{r.endDate}</td>
              <td className="admin-muted">{r.reason || "—"}</td>
              <td>
                <button type="button" className="admin-btn admin-btn--danger" onClick={() => remove(r.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
