// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { settingsCopy } from "../src/lib/settingsCopy.js";
import { faqs, checkoutNotice } from "../src/data/content.js";

const live = { depositPct: 0, smallOrderThresholdCents: 5000, smallOrderFeeCents: 2500 };
const feeFaq = faqs.find((f) => f.onlyWithSmallOrderFee);

test("small-order fee FAQ reads from settings", () => {
  assert.equal(feeFaq.question, "Is there a small-order fee?");
  assert.equal(
    settingsCopy(feeFaq.answer, live),
    "Orders under $50 in rentals include a $25 small-order fee, in addition to any delivery fee."
  );
  assert.equal(
    settingsCopy(feeFaq.answer, { ...live, smallOrderThresholdCents: 7550, smallOrderFeeCents: 1000 }),
    "Orders under $75.50 in rentals include a $10 small-order fee, in addition to any delivery fee."
  );
});

test("placeholders show … until settings load", () => {
  assert.equal(settingsCopy("Under {smallOrderThreshold}: {smallOrderFee}", null), "Under …: …");
  assert.equal(settingsCopy("{depositPct}% down", null), "…% down");
  assert.equal(settingsCopy({ deposit: "a", noDeposit: "b" }, null), "…");
});

test("deposit on/off copy still switches", () => {
  const both = { deposit: "Pay {depositPct}% now", noDeposit: "Nothing upfront" };
  assert.equal(settingsCopy(both, { ...live, depositPct: 15 }), "Pay 15% now");
  assert.equal(settingsCopy(both, live), "Nothing upfront");
});

test("no FAQ or checkout point is left with a raw placeholder", () => {
  for (const s of [{ ...live, depositPct: 15 }, live]) {
    for (const copy of [...faqs.map((f) => f.answer), ...checkoutNotice.points]) {
      assert.doesNotMatch(settingsCopy(copy, s), /[{}]/, String(copy));
    }
  }
});

test("delivery FAQ promises free delivery in Naples", () => {
  const delivery = faqs.find((f) => f.question === "Is delivery included?");
  assert.match(delivery.answer, /^Delivery and setup are free within Naples\./);
});
