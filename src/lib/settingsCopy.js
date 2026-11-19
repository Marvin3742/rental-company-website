import { formatCentsShort } from "./format.js";

/**
 * Resolve settings-dependent site copy (see content.js) against the live
 * settings (useSettings), so the copy can't drift from what checkout charges.
 * `copy` is a string whose placeholders get filled in — {depositPct},
 * {smallOrderFee}, {smallOrderThreshold} — or { deposit, noDeposit }, where
 * noDeposit is used while deposits are turned off (deposit % set to 0). Shows
 * "…" until the settings have loaded.
 */
export function settingsCopy(copy, settings) {
  const depositPct = settings?.depositPct;
  if (typeof copy !== "string") {
    if (depositPct == null) return "…";
    copy = depositPct > 0 ? copy.deposit : copy.noDeposit;
  }
  const values = {
    depositPct: depositPct == null ? "…" : String(depositPct),
    smallOrderFee: settings?.smallOrderFeeCents == null ? "…" : formatCentsShort(settings.smallOrderFeeCents),
    smallOrderThreshold:
      settings?.smallOrderThresholdCents == null ? "…" : formatCentsShort(settings.smallOrderThresholdCents),
  };
  return copy.replace(/\{(depositPct|smallOrderFee|smallOrderThreshold)\}/g, (_, key) => values[key]);
}
