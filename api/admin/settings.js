// GET   /api/admin/settings
// PATCH /api/admin/settings { maxBookingsPerDay?, depositPct?, bufferDays?, deliveryFeeCents? }
import { withApi, HttpError } from "../../lib/server/http.js";
import { prisma } from "../../lib/server/prisma.js";
import { requireAdmin } from "../../lib/server/auth.js";

async function ensureSettings() {
  return prisma.setting.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} });
}

const NON_NEG_INT = (v, label) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new HttpError(400, `${label} must be a non-negative integer`);
  return n;
};

export default withApi({
  async GET(req) {
    requireAdmin(req);
    const s = await ensureSettings();
    return {
      maxBookingsPerDay: s.maxBookingsPerDay,
      depositPct: s.depositPct,
      bufferDays: s.bufferDays,
      deliveryFeeCents: s.deliveryFeeCents,
    };
  },

  async PATCH(req) {
    requireAdmin(req);
    await ensureSettings();
    const { maxBookingsPerDay, depositPct, bufferDays, deliveryFeeCents } = req.body ?? {};
    const data = {};
    if (maxBookingsPerDay !== undefined) data.maxBookingsPerDay = NON_NEG_INT(maxBookingsPerDay, "maxBookingsPerDay");
    if (bufferDays !== undefined) data.bufferDays = NON_NEG_INT(bufferDays, "bufferDays");
    if (deliveryFeeCents !== undefined) data.deliveryFeeCents = NON_NEG_INT(deliveryFeeCents, "deliveryFeeCents");
    if (depositPct !== undefined) {
      const n = NON_NEG_INT(depositPct, "depositPct");
      if (n > 100) throw new HttpError(400, "depositPct must be 0–100");
      data.depositPct = n;
    }
    if (Object.keys(data).length === 0) throw new HttpError(400, "Nothing to update");

    const s = await prisma.setting.update({ where: { id: "singleton" }, data });
    return {
      maxBookingsPerDay: s.maxBookingsPerDay,
      depositPct: s.depositPct,
      bufferDays: s.bufferDays,
      deliveryFeeCents: s.deliveryFeeCents,
    };
  },
});
