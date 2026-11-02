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
 * Fill the {depositPct} placeholder in site copy (see content.js) with the live
 * deposit %, so the copy can't drift from what checkout charges. Shows "…"
 * until the setting has loaded.
 */
export function withDepositPct(text, depositPct) {
  return text.replaceAll("{depositPct}", depositPct == null ? "…" : String(depositPct));
}
