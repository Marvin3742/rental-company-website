import { useEffect, useState } from "react";
import { fetchSettings } from "./checkout";

/**
 * Public settings ({ depositPct, deliveryFeeCents, smallOrderThresholdCents,
 * smallOrderFeeCents }) from /api/settings — the values the server actually
 * charges with. null until loaded (or if it fails). Fill them into site copy
 * with settingsCopy (./settingsCopy).
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
