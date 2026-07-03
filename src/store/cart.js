import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cart entries are keyed by (kind, slug). Prices are stored in cents so the cart
// math matches the server. The server always recomputes totals at checkout —
// these values are for display only.
//
// entry shape: { kind: "product"|"package", slug, name, unitPriceCents, unit, image, quantity }

const sameLine = (a, kind, slug) => a.kind === kind && a.slug === slug;

export const useCart = create(
  persist(
    (set) => ({
      items: [],

      addItem: (entry, quantity = 1) =>
        set((state) => {
          const idx = state.items.findIndex((i) => sameLine(i, entry.kind, entry.slug));
          if (idx >= 0) {
            const items = state.items.slice();
            items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
            return { items };
          }
          return { items: [...state.items, { ...entry, quantity }] };
        }),

      setQuantity: (kind, slug, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            sameLine(i, kind, slug) ? { ...i, quantity: Math.max(1, Math.floor(quantity) || 1) } : i
          ),
        })),

      removeItem: (kind, slug) =>
        set((state) => ({ items: state.items.filter((i) => !sameLine(i, kind, slug)) })),

      clear: () => set({ items: [] }),
    }),
    { name: "solimar-cart", version: 1 }
  )
);

// Selectors (use with useCart(selector) to avoid unnecessary re-renders).
export const selectCount = (state) => state.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotalCents = (state) =>
  state.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

/** Build a cart entry from a DB product ({ slug, name, priceCents, unit, images }). */
export function productEntry(item) {
  return {
    kind: "product",
    slug: item.slug,
    name: item.name,
    unitPriceCents: item.priceCents,
    unit: item.unit,
    image: item.images?.[0] ?? null,
  };
}

/** Build a cart entry from a DB package ({ slug, name, priceCents, image }). */
export function packageEntry(pkg) {
  return {
    kind: "package",
    slug: pkg.slug,
    name: pkg.name,
    unitPriceCents: pkg.priceCents,
    unit: "day",
    image: pkg.image,
  };
}
