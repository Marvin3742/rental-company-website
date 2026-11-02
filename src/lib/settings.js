import { useEffect, useState } from "react";
import { fetchSettings } from "./checkout";

/**
 * Public settings ({ depositPct, deliveryFeeCents }) from /api/settings — the
 * values the server actually charges with. null until loaded (or if it fails).
 */
export function useSettings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((s) => !cancelled && setSettings(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}

/**
 * Resolve deposit-dependent site copy (see content.js) against the live deposit %,
 * so the copy can't drift from what checkout charges. `copy` is a string whose
 * {depositPct} placeholders get filled in, or { deposit, noDeposit } — noDeposit
 * is used while deposits are turned off (deposit % set to 0). Shows "…" until
 * the setting has loaded.
 */
export function depositCopy(copy, depositPct) {
  if (typeof copy !== "string") {
    if (depositPct == null) return "…";
    copy = depositPct > 0 ? copy.deposit : copy.noDeposit;
  }
  return copy.replaceAll("{depositPct}", depositPct == null ? "…" : String(depositPct));
}
