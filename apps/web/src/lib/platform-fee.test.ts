import assert from "node:assert/strict";
import test from "node:test";
import { platformFeeAmount, feeRateBps, PLATFORM_FEE_RATE_BPS } from "./platform-fee";

test("charges the default 5% only on the billed amount", () => {
  assert.equal(PLATFORM_FEE_RATE_BPS, 500);
  assert.equal(platformFeeAmount(1000), 50);
  assert.equal(platformFeeAmount(10_000), 500);
  assert.equal(platformFeeAmount(123.45), 6.17);
});

test("respects a creator's custom percent fee", () => {
  assert.equal(platformFeeAmount(10_000, { feeType: "percent", feeValue: 10 }), 1000);
  assert.equal(platformFeeAmount(10_000, { feeType: "percent", feeValue: 2.5 }), 250);
});

test("supports a fixed fee instead of a percent", () => {
  assert.equal(platformFeeAmount(10_000, { feeType: "fixed", feeValue: 200 }), 200);
  // a fixed fee never exceeds the billed amount
  assert.equal(platformFeeAmount(100, { feeType: "fixed", feeValue: 200 }), 100);
});

test("clamps to feeMin and feeMax when configured", () => {
  assert.equal(platformFeeAmount(100, { feeValue: 5, feeMin: 20 }), 20);
  assert.equal(platformFeeAmount(100_000, { feeValue: 5, feeMax: 500 }), 500);
});

test("does not charge empty or invalid billing", () => {
  assert.equal(platformFeeAmount(0), 0);
  assert.equal(platformFeeAmount(-100), 0);
  assert.equal(platformFeeAmount(Number.NaN), 0);
});

test("feeRateBps mirrors the percent config in basis points", () => {
  assert.equal(feeRateBps(), 500);
  assert.equal(feeRateBps({ feeType: "percent", feeValue: 10 }), 1000);
  assert.equal(feeRateBps({ feeType: "fixed", feeValue: 200 }), 0);
});
