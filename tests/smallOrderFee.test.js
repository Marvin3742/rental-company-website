// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSmallOrderFee, SMALL_ORDER_DEFAULTS } from "../src/lib/smallOrderFee.js";

const settings = { smallOrderThresholdCents: 5000, smallOrderFeeCents: 2500 }; // $25 under $50

test("defaults are $25 on orders under $50", () => {
  assert.deepEqual(SMALL_ORDER_DEFAULTS, settings);
});

test("orders under the threshold pay the fee", () => {
  assert.equal(computeSmallOrderFee(0, settings), 2500); // $0
  assert.equal(computeSmallOrderFee(1000, settings), 2500); // $10
  assert.equal(computeSmallOrderFee(4999, settings), 2500); // $49.99
});

test("orders at or over the threshold don't", () => {
  assert.equal(computeSmallOrderFee(5000, settings), 0); // $50.00
  assert.equal(computeSmallOrderFee(50000, settings), 0); // $500
});

test("a fee of 0 turns it off", () => {
  const off = { ...settings, smallOrderFeeCents: 0 };
  for (const subtotal of [0, 1000, 4999, 5000, 50000]) assert.equal(computeSmallOrderFee(subtotal, off), 0);
});

test("follows changed settings", () => {
  const custom = { smallOrderThresholdCents: 10000, smallOrderFeeCents: 1500 }; // $15 under $100
  assert.equal(computeSmallOrderFee(9999, custom), 1500);
  assert.equal(computeSmallOrderFee(10000, custom), 0);
});

test("no settings yet (still loading) means no fee", () => {
  assert.equal(computeSmallOrderFee(1000, null), 0);
  assert.equal(computeSmallOrderFee(1000, undefined), 0);
  assert.equal(computeSmallOrderFee(1000, {}), 0);
});
