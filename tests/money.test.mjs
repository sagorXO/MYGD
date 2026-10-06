import test from "node:test";
import assert from "node:assert/strict";
import {
  toCents,
  fromCents,
  centsToDecimalString,
  decimalToCents,
  moneyToNumber,
  decimalToNumber,
  percentOf,
  allocateProportionally,
} from "../src/lib/money.ts";

test("moneyToNumber turns a database money decimal into a 2-decimal display number", () => {
  assert.equal(moneyToNumber({ toString: () => "7.5" }), 7.5);
  assert.equal(moneyToNumber("12.50"), 12.5);
  assert.equal(moneyToNumber({ toString: () => "0.05" }), 0.05);
  assert.throws(() => moneyToNumber({ toString: () => "1.234" }), RangeError);
});

test("decimalToNumber keeps unit costs with up to 4 decimals", () => {
  assert.equal(decimalToNumber({ toString: () => "0.0125" }), 0.0125);
  assert.equal(decimalToNumber("3"), 3);
  assert.throws(() => decimalToNumber("abc"), TypeError);
});

test("toCents reads exact 2-decimal amounts from numbers and strings", () => {
  assert.equal(toCents("7.50"), 750);
  assert.equal(toCents(7.5), 750);
  assert.equal(toCents("0.05"), 5);
  assert.equal(toCents(-3.2), -320);
  assert.equal(toCents(0), 0);
});

test("toCents tolerates binary float noise from arithmetic on 2-decimal values", () => {
  assert.equal(toCents(0.1 + 0.2), 30);
  assert.equal(toCents(19.9 * 3), 5970);
});

test("toCents refuses amounts with more than 2 real decimals instead of rounding silently", () => {
  assert.throws(() => toCents(1.005), RangeError);
  assert.throws(() => toCents("2.345"), RangeError);
});

test("toCents refuses non-numeric and non-finite input", () => {
  assert.throws(() => toCents(Number.NaN), TypeError);
  assert.throws(() => toCents(Number.POSITIVE_INFINITY), TypeError);
  assert.throws(() => toCents("abc"), TypeError);
  assert.throws(() => toCents(""), TypeError);
});

test("fromCents and centsToDecimalString are exact", () => {
  assert.equal(fromCents(1050), 10.5);
  assert.equal(centsToDecimalString(1050), "10.50");
  assert.equal(centsToDecimalString(5), "0.05");
  assert.equal(centsToDecimalString(0), "0.00");
  assert.equal(centsToDecimalString(-5), "-0.05");
  assert.equal(centsToDecimalString(-12345), "-123.45");
});

test("fromCents refuses non-integer cents", () => {
  assert.throws(() => fromCents(10.5), TypeError);
});

test("decimalToCents accepts database decimals (objects with toString), strings and numbers", () => {
  const dbDecimal = { toString: () => "12.5" };
  assert.equal(decimalToCents(dbDecimal), 1250);
  assert.equal(decimalToCents("12.50"), 1250);
  assert.equal(decimalToCents(12.5), 1250);
});

test("percentOf rounds half up on whole cents", () => {
  assert.equal(percentOf(2100, 10), 210);
  assert.equal(percentOf(1999, 10), 200); // 199.9
  assert.equal(percentOf(5, 50), 3); // 2.5 rounds up
  assert.equal(percentOf(1000, 12.5), 125);
  assert.equal(percentOf(1000, 0), 0);
  assert.equal(percentOf(1000, 100), 1000);
});

test("percentOf refuses percentages outside 0..100 or with more than 2 decimals", () => {
  assert.throws(() => percentOf(1000, -1), RangeError);
  assert.throws(() => percentOf(1000, 100.01), RangeError);
  assert.throws(() => percentOf(1000, 10.123), RangeError);
});

test("allocateProportionally splits a total by weight and always sums exactly (largest remainder)", () => {
  const parts = allocateProportionally(100, [1, 1, 1]);
  assert.deepEqual(parts, [34, 33, 33]);
  assert.equal(parts.reduce((a, b) => a + b, 0), 100);

  const weighted = allocateProportionally(220, [1500, 700]);
  assert.deepEqual(weighted, [150, 70]);
});

test("allocateProportionally handles zero total and refuses impossible splits", () => {
  assert.deepEqual(allocateProportionally(0, [5, 5]), [0, 0]);
  assert.throws(() => allocateProportionally(10, [0, 0]), RangeError);
  assert.throws(() => allocateProportionally(10, []), RangeError);
  assert.throws(() => allocateProportionally(10, [-1, 2]), RangeError);
});
