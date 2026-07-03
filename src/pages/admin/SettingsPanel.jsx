import { useEffect, useState } from "react";
import { getAdminSettings, patchSettings } from "../../lib/admin";

export default function SettingsPanel() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAdminSettings()
      .then((s) => setForm(s))
      .catch((e) => setError(e.message));
  }, []);

  if (error && !form) return <p className="admin-error">{error}</p>;
  if (!form) return <p className="admin-muted">Loading…</p>;

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await patchSettings({
        maxBookingsPerDay: parseInt(form.maxBookingsPerDay, 10),
        depositPct: parseInt(form.depositPct, 10),
        bufferDays: parseInt(form.bufferDays, 10),
      });
      setForm(updated);
      setSaved(true);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Settings</h2>
      {error && <p className="admin-error">{error}</p>}
      <form className="admin-settings" onSubmit={save}>
        <label>
          <span>Max bookings per day</span>
          <input type="number" min="0" value={form.maxBookingsPerDay} onChange={set("maxBookingsPerDay")} />
          <small>One delivery team — how many deliveries you can handle in a day.</small>
        </label>
        <label>
          <span>Deposit percentage (%)</span>
          <input type="number" min="0" max="100" value={form.depositPct} onChange={set("depositPct")} />
          <small>Used when a customer chooses "pay deposit now".</small>
        </label>
        <label>
          <span>Turnaround buffer (days)</span>
          <input type="number" min="0" value={form.bufferDays} onChange={set("bufferDays")} />
          <small>Extra days an item is held after the event (next-day pickup = 1).</small>
        </label>
        <div className="admin-note">
          <strong>Delivery fees</strong> are calculated by distance from the shop: free within 10&nbsp;mi,
          $30 within 25&nbsp;mi, $60 within 50&nbsp;mi. Beyond 50&nbsp;mi, customers are asked to call.
          Adjust the tiers in <code>lib/server/delivery.js</code>.
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
          {busy ? "Saving…" : saved ? "Saved" : "Save settings"}
        </button>
      </form>
    </section>
  );
}
