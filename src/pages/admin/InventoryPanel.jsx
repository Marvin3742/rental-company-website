import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  listProducts,
  patchProduct,
  createProduct,
  deleteProduct,
  uploadInventoryImage,
  getInventoryAvailability,
} from "../../lib/admin";
import { compressToWebp } from "../../lib/image";
import { toISODate, formatDateLong } from "../../lib/availability";

/** "YYYY-MM-DD" → local Date at midnight. */
const isoToLocalDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function InventoryPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Inventory</h2>
      <p className="admin-muted">
        Edit prices, stock, and availability — changes show on the website right away. Set stock to 0
        (or turn off Active) to stop taking bookings for an item.
      </p>
      {error && <p className="admin-error">{error}</p>}

      <InventoryCalendar />

      <AddItemForm onCreated={(p) => setProducts((list) => [p, ...list])} />

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : (
        <table className="admin-table admin-inv-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Photos</th>
              <th>Unit</th>
              <th>Price ($)</th>
              <th>Stock</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onRemoved={(id) => setProducts((list) => list.filter((x) => x.id !== id))}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// Calendar that shows, for a chosen day, how much of each item is committed
// (active reservations incl. the turnaround buffer) vs. available. Days are tinted:
// amber = some inventory committed, red = an item is sold out or the day is blocked.
function InventoryCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the visible month, padded a week each side so adjacent-month cells tint too.
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const from = toISODate(new Date(first.getFullYear(), first.getMonth(), first.getDate() - 7));
    const to = toISODate(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 7));
    let cancelled = false;
    setLoading(true);
    setError(null);
    getInventoryAvailability(from, to)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const { fullDates, partialDates } = useMemo(() => {
    const full = [];
    const partial = [];
    for (const [iso, day] of Object.entries(data?.days ?? {})) {
      const soldOut = day.globalBlackout || day.items.some((it) => it.available === 0);
      if (soldOut) full.push(isoToLocalDate(iso));
      else if (day.items.length > 0 || day.atCap) partial.push(isoToLocalDate(iso));
    }
    return { fullDates: full, partialDates: partial };
  }, [data]);

  const dayKey = selectedDay ? toISODate(selectedDay) : "";
  const dayData = data?.days?.[dayKey];
  const products = data?.products ?? [];

  // Full per-item breakdown for the selected day (every product, constrained or not).
  const rows = products.map((p) => {
    const hit = dayData?.items.find((it) => it.slug === p.slug);
    const blackedOut = hit?.blackedOut ?? dayData?.globalBlackout ?? false;
    const reserved = hit?.reserved ?? 0;
    return {
      ...p,
      reserved,
      blackedOut,
      available: blackedOut ? 0 : p.totalStock - reserved,
    };
  });

  return (
    <div className="admin-invcal">
      <div className="admin-invcal__cal admin-cal">
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selectedDay}
          onSelect={(d) => d && setSelectedDay(d)}
          modifiers={{ invFull: fullDates, invPartial: partialDates }}
          modifiersClassNames={{ invFull: "admin-invcal__full", invPartial: "admin-invcal__partial" }}
          weekStartsOn={0}
        />
        <ul className="admin-invcal__legend">
          <li>
            <span className="admin-invcal__swatch admin-invcal__swatch--partial" /> Some committed
          </li>
          <li>
            <span className="admin-invcal__swatch admin-invcal__swatch--full" /> Item sold out / blocked
          </li>
        </ul>
      </div>

      <div className="admin-invcal__detail">
        <h3 className="admin-invcal__title">
          {selectedDay ? formatDateLong(dayKey) : "Pick a day"}
        </h3>
        {error && <p className="admin-error">{error}</p>}
        {loading && <p className="admin-muted">Loading…</p>}
        {!loading && !error && (
          <>
            <p className="admin-muted admin-invcal__meta">
              Deliveries: {dayData?.bookings ?? 0} / {data?.maxBookingsPerDay ?? "—"}
              {dayData?.atCap ? " · at capacity" : ""}
              {dayData?.globalBlackout ? " · day blocked" : ""}
            </p>
            {products.length === 0 ? (
              <p className="admin-muted">No active inventory.</p>
            ) : (
              <table className="admin-table admin-invcal__table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Committed</th>
                    <th>Available</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.slug} className={r.available === 0 ? "admin-invcal__row--full" : ""}>
                      <td>{r.name}</td>
                      <td>{r.reserved}</td>
                      <td>{r.blackedOut ? "blocked" : r.available}</td>
                      <td className="admin-muted">{r.totalStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Multi-photo manager: compresses each pick to WebP, uploads to Blob, appends the
// URLs to the list. The first image is the cover shown on the site. `onChange`
// receives the full updated array. Used by the Add form and each inventory row.
function ImageManager({ value = [], onChange, nameHint }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same files
    if (files.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const urls = [];
      for (const file of files) {
        const blob = await compressToWebp(file);
        const { url } = await uploadInventoryImage(blob, nameHint);
        urls.push(url);
      }
      onChange([...value, ...urls]);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));

  const makeCover = (i) => {
    const next = value.slice();
    const [moved] = next.splice(i, 1);
    next.unshift(moved);
    onChange(next);
  };

  return (
    <div className="admin-images">
      <div className="admin-images__grid">
        {value.map((url, i) => (
          <figure key={url + i} className="admin-images__item">
            <img src={url} alt="" />
            {i === 0 && <figcaption className="admin-images__cover">Cover</figcaption>}
            <button
              type="button"
              className="admin-images__remove"
              onClick={() => removeAt(i)}
              aria-label="Remove photo"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {i !== 0 && (
              <button type="button" className="admin-images__make-cover" onClick={() => makeCover(i)}>
                Make cover
              </button>
            )}
          </figure>
        ))}
        <label className={`admin-images__add ${busy ? "is-busy" : ""}`}>
          {busy ? "Uploading…" : "+ Add photos"}
          <input type="file" accept="image/*" multiple hidden disabled={busy} onChange={addPhotos} />
        </label>
      </div>
      {err && <span className="admin-error">{err}</span>}
    </div>
  );
}

const BLANK = { name: "", price: "", unit: "each", stock: "1", images: [], description: "" };

function AddItemForm({ onCreated }) {
  const [f, setF] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const created = await createProduct({
        name: f.name,
        priceCents: Math.round(parseFloat(f.price) * 100),
        unit: f.unit === "day" ? "DAY" : "EACH",
        totalStock: parseInt(f.stock, 10),
        description: f.description,
        images: f.images,
      });
      onCreated(created);
      setF(BLANK);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-additem" onSubmit={submit}>
      <h3 className="admin-additem__title">Add a new item</h3>
      <div className="admin-additem__grid">
        <label>
          Name
          <input value={f.name} onChange={set("name")} required />
        </label>
        <label>
          Price ($)
          <input type="number" min="0" step="0.01" value={f.price} onChange={set("price")} required />
        </label>
        <label>
          Unit
          <select value={f.unit} onChange={set("unit")}>
            <option value="each">each</option>
            <option value="day">day</option>
          </select>
        </label>
        <label>
          Stock
          <input type="number" min="0" step="1" value={f.stock} onChange={set("stock")} required />
        </label>
        <div className="admin-additem__wide admin-additem__field">
          <span>Photos (optional)</span>
          <ImageManager
            value={f.images}
            nameHint={f.name}
            onChange={(images) => setF((s) => ({ ...s, images }))}
          />
        </div>
        <label className="admin-additem__wide">
          Description (optional)
          <input value={f.description} onChange={set("description")} />
        </label>
      </div>
      {err && <p className="admin-error">{err}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
        {busy ? "Adding…" : "Add item"}
      </button>
    </form>
  );
}

function ProductRow({ product, onRemoved }) {
  const [price, setPrice] = useState((product.priceCents / 100).toFixed(2));
  const [stock, setStock] = useState(String(product.totalStock));
  const [active, setActive] = useState(product.active);
  const [images, setImages] = useState(product.images ?? []);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);

  const remove = async () => {
    if (!confirm(`Remove "${product.name}" from inventory? This can't be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      await deleteProduct(product.id);
      onRemoved(product.id); // row unmounts on success
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  // Photos persist immediately on every change (add / remove / reorder),
  // separate from the price/stock Save button.
  const saveImages = async (next) => {
    setImages(next); // optimistic
    setErr(null);
    try {
      const updated = await patchProduct({ id: product.id, images: next });
      setImages(updated.images ?? next);
    } catch (e) {
      setErr(e.message);
    }
  };

  const dirty =
    price !== (product.priceCents / 100).toFixed(2) ||
    stock !== String(product.totalStock) ||
    active !== product.active;

  const save = async () => {
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      await patchProduct({
        id: product.id,
        totalStock: parseInt(stock, 10),
        priceCents: Math.round(parseFloat(price) * 100),
        active,
      });
      setSaved(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td data-label="Item" className="admin-inv-table__name">{product.name}</td>
      <td data-label="Photos">
        <ImageManager value={images} nameHint={product.slug || product.name} onChange={saveImages} />
      </td>
      <td data-label="Unit" className="admin-muted">/{product.unit.toLowerCase()}</td>
      <td data-label="Price ($)">
        <input className="admin-num" type="number" min="0" step="0.01" value={price} onChange={(e) => { setPrice(e.target.value); setSaved(false); }} />
      </td>
      <td data-label="Stock">
        <input className="admin-num" type="number" min="0" step="1" value={stock} onChange={(e) => { setStock(e.target.value); setSaved(false); }} />
      </td>
      <td data-label="Active">
        <input type="checkbox" checked={active} onChange={(e) => { setActive(e.target.checked); setSaved(false); }} />
      </td>
      <td data-label="">
        <div className="admin-row-actions">
          <button type="button" className="admin-btn admin-btn--primary" disabled={!dirty || busy} onClick={save}>
            {busy ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
          <button type="button" className="admin-btn admin-btn--danger" disabled={busy} onClick={remove}>
            Remove
          </button>
        </div>
        {err && <div className="admin-error">{err}</div>}
      </td>
    </tr>
  );
}
