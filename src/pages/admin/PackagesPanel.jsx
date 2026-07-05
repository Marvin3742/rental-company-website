import { useEffect, useState } from "react";
import {
  listAdminPackages,
  createPackage,
  patchPackage,
  deletePackage,
  listProducts,
  uploadInventoryImage,
} from "../../lib/admin";
import { compressToWebp } from "../../lib/image";

const BLANK = {
  name: "",
  price: "",
  image: "",
  includesText: "",
  badge: "",
  tagline: "",
  active: true,
  items: [],
  sortOrder: "0",
};

const formFromPkg = (pkg) => ({
  name: pkg.name,
  price: (pkg.priceCents / 100).toString(),
  image: pkg.image || "",
  includesText: (pkg.includesDisplay || []).join("\n"),
  badge: pkg.badge || "",
  tagline: pkg.tagline || "",
  active: pkg.active,
  items: (pkg.items || []).map((it) => ({ productId: it.productId, quantity: String(it.quantity) })),
  sortOrder: String(pkg.sortOrder ?? 0),
});

const toPayload = (form) => ({
  name: form.name,
  priceCents: Math.round(parseFloat(form.price || "0") * 100),
  image: form.image || null,
  includesDisplay: form.includesText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean),
  badge: form.badge || null,
  tagline: form.tagline || null,
  items: form.items
    .filter((it) => it.productId && Number(it.quantity) > 0)
    .map((it) => ({ productId: it.productId, quantity: parseInt(it.quantity, 10) })),
  sortOrder: parseInt(form.sortOrder, 10) || 0,
});

export default function PackagesPanel() {
  const [packages, setPackages] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([listAdminPackages(), listProducts()])
      .then(([pkgs, prods]) => {
        setPackages(pkgs);
        setProducts(prods);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Packages</h2>
      <p className="admin-muted">
        Create and edit the bundles shown on the site. The bill-of-materials controls what each
        package reserves — that&apos;s what the availability check uses.
      </p>
      {error && <p className="admin-error">{error}</p>}

      {packages === null && !error ? (
        <p className="admin-muted">Loading…</p>
      ) : (
        <>
          <AddPackage
            products={products}
            onCreated={(p) => setPackages((list) => [p, ...(list ?? [])])}
          />
          <div className="admin-pkg-list">
            {(packages ?? []).map((p) => (
              <PackageEditor
                key={p.id}
                pkg={p}
                products={products}
                onSaved={(u) => setPackages((list) => list.map((x) => (x.id === u.id ? u : x)))}
                onRemoved={(id) => setPackages((list) => list.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Single-image upload for a package (compress → Blob → set URL).
function PackageImage({ value, onChange, nameHint }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await compressToWebp(file);
      const { url } = await uploadInventoryImage(blob, nameHint);
      onChange(url);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-images">
      <div className="admin-images__grid">
        {value && (
          <figure className="admin-images__item">
            <img src={value} alt="" />
            <button
              type="button"
              className="admin-images__remove"
              onClick={() => onChange("")}
              aria-label="Remove photo"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </figure>
        )}
        <label className={`admin-images__add ${busy ? "is-busy" : ""}`}>
          {busy ? "Uploading…" : value ? "Replace" : "+ Add photo"}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={pick} />
        </label>
      </div>
      {err && <span className="admin-error">{err}</span>}
    </div>
  );
}

// Shared fields for both the add form and the per-package editor.
function PackageFields({ form, setForm, products }) {
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const setItem = (i, k, v) =>
    setForm((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }));
  const addRow = () => setForm((s) => ({ ...s, items: [...s.items, { productId: "", quantity: "1" }] }));
  const removeRow = (i) => setForm((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  return (
    <div className="admin-pkg__fields">
      <div className="admin-pkg__grid">
        <label>
          Name
          <input value={form.name} onChange={set("name")} required />
        </label>
        <label>
          Price ($)
          <input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} required />
        </label>
        <label>
          Badge (optional)
          <input value={form.badge} onChange={set("badge")} placeholder="e.g. Most popular" />
        </label>
        <label>
          Tagline (optional)
          <input value={form.tagline} onChange={set("tagline")} />
        </label>
        <label>
          Order
          <input type="number" step="1" value={form.sortOrder} onChange={set("sortOrder")} />
        </label>
      </div>

      <div className="admin-pkg__field">
        <span>Photo</span>
        <PackageImage
          value={form.image}
          nameHint={form.name}
          onChange={(url) => setForm((s) => ({ ...s, image: url }))}
        />
      </div>

      <label className="admin-pkg__field">
        <span>Included (one line each — shown on the card)</span>
        <textarea
          rows={4}
          value={form.includesText}
          onChange={set("includesText")}
          placeholder={"20×30 Premium frame tent\n9 Tables\n72 Chairs"}
        />
      </label>

      <div className="admin-pkg__field">
        <span>Bill of materials — what this package reserves</span>
        <div className="admin-pkg__bom">
          {form.items.length === 0 && (
            <p className="admin-muted">No items yet — add the products this package includes.</p>
          )}
          {form.items.map((it, i) => (
            <div className="admin-pkg__bom-row" key={i}>
              <select value={it.productId} onChange={(e) => setItem(i, "productId", e.target.value)}>
                <option value="">Select item…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                value={it.quantity}
                onChange={(e) => setItem(i, "quantity", e.target.value)}
                aria-label="Quantity"
              />
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => removeRow(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="admin-btn" onClick={addRow}>
            + Add item
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPackage({ products, onCreated }) {
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const created = await createPackage(toPayload(form));
      onCreated(created);
      setForm(BLANK);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-additem" onSubmit={submit}>
      <h3 className="admin-additem__title">Add a package</h3>
      <PackageFields form={form} setForm={setForm} products={products} />
      {err && <p className="admin-error">{err}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
        {busy ? "Adding…" : "Add package"}
      </button>
    </form>
  );
}

function PackageEditor({ pkg, products, onSaved, onRemoved }) {
  const [form, setForm] = useState(() => formFromPkg(pkg));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      const updated = await patchPackage({ id: pkg.id, active: form.active, ...toPayload(form) });
      onSaved(updated);
      setForm(formFromPkg(updated));
      setSaved(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${pkg.name}"? This can't be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      await deletePackage(pkg.id);
      onRemoved(pkg.id);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <article className="admin-pkg">
      <div className="admin-pkg__head">
        <h3>{pkg.name}</h3>
        <label className="admin-pkg__active">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))}
          />
          Active
        </label>
      </div>
      <PackageFields form={form} setForm={setForm} products={products} />
      {err && <p className="admin-error">{err}</p>}
      <div className="admin-row-actions">
        <button type="button" className="admin-btn admin-btn--primary" disabled={busy} onClick={save}>
          {busy ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
        <button type="button" className="admin-btn admin-btn--danger" disabled={busy} onClick={remove}>
          Delete
        </button>
      </div>
    </article>
  );
}
