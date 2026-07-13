import { create } from "zustand";

// Lightweight, ephemeral toast queue (not persisted — toasts are transient UI).
// A toast is keyed by (kind, slug) so rapid clicks on the SAME item collapse
// into one card whose quantity counts up, instead of stacking duplicates.
//
// toast shape: { id, kind, slug, name, image, quantity, nonce }
//   nonce bumps on every re-add so the visible card can reset its dismiss timer.

let idSeq = 0;

export const useToasts = create((set) => ({
  toasts: [],

  /** Announce that `quantity` of an item was added to the cart. */
  addToast: ({ kind, slug, name, image, quantity = 1 }) =>
    set((state) => {
      const idx = state.toasts.findIndex((t) => t.kind === kind && t.slug === slug);
      if (idx >= 0) {
        const toasts = state.toasts.slice();
        const prev = toasts[idx];
        toasts[idx] = { ...prev, quantity: prev.quantity + quantity, nonce: prev.nonce + 1 };
        return { toasts };
      }
      return {
        toasts: [...state.toasts, { id: ++idSeq, kind, slug, name, image, quantity, nonce: 0 }],
      };
    }),

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
