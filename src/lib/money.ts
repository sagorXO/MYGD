// MY GERMAN DÖNER — Exact money arithmetic in integer cents (PRD P.4)
//
// [ADR] Context: money was stored and added as binary floating point, so totals and VAT could
//   drift by a cent and never reconciled with the printed receipt.
// Decision: all arithmetic is done on integer cents. Database columns are Decimal(10,2); API
//   responses expose plain 2-decimal numbers for display only. Rounding is half up (away from
//   zero for negative amounts), applied once per line.
// Consequence: results are exact and reproducible. Callers convert at the boundary with
//   toCents / decimalToCents (in) and fromCents / centsToDecimalString (out).

export type Cents = number;

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;
/** Largest error accepted when a binary float stands for a 2-decimal amount (e.g. 0.1 + 0.2). */
const FLOAT_NOISE = 1e-6;
const MAX_PERCENT_DECIMALS = 2;

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) throw new TypeError(`${name} must be an integer number of cents, got ${value}`);
}

function parseDecimalString(text: string): Cents {
  const negative = text.startsWith("-");
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction = ""] = unsigned.split(".");
  const extra = fraction.slice(2);
  if (/[^0]/.test(extra)) throw new RangeError(`Money has more than 2 decimal places: "${text}"`);
  const cents = Number(whole) * 100 + Number(fraction.slice(0, 2).padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new RangeError(`Money amount is too large: "${text}"`);
  return negative && cents !== 0 ? -cents : cents;
}

/**
 * Reads an exact amount of money as integer cents.
 * Accepts strings ("7.50"), numbers (7.5) and tolerates binary float noise from arithmetic,
 * but refuses amounts that really have more than 2 decimals instead of rounding them silently.
 */
export function toCents(value: number | string): Cents {
  if (typeof value === "string") {
    const text = value.trim();
    if (!DECIMAL_PATTERN.test(text)) throw new TypeError(`Not a money amount: "${value}"`);
    return parseDecimalString(text);
  }
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`Not a money amount: ${String(value)}`);
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > FLOAT_NOISE) throw new RangeError(`Money has more than 2 decimal places: ${value}`);
  return rounded === 0 ? 0 : rounded;
}

/** Converts a database decimal (any object with a decimal toString), string or number to cents. */
export function decimalToCents(value: number | string | { toString(): string }): Cents {
  if (typeof value === "number" || typeof value === "string") return toCents(value);
  return toCents(value.toString());
}

/** Cents to a plain number for display DTOs. Never feed the result back into arithmetic. */
export function fromCents(cents: Cents): number {
  assertInteger(cents, "cents");
  return cents / 100;
}

/**
 * A database money decimal as a plain 2-decimal number, for API responses (display only).
 * Prisma returns Decimal objects, which JSON-serialise as strings; clients expect numbers.
 */
export function moneyToNumber(value: number | string | { toString(): string }): number {
  return fromCents(decimalToCents(value));
}

/** A database decimal that is not money (for example a unit cost with 4 decimals) as a number. */
export function decimalToNumber(value: number | string | { toString(): string }): number {
  const text = typeof value === "number" ? String(value) : value.toString().trim();
  if (!DECIMAL_PATTERN.test(text)) throw new TypeError(`Not a decimal number: "${text}"`);
  return Number(text);
}

/** Cents to an exact decimal string such as "10.50", suitable for a Decimal(10,2) column. */
export function centsToDecimalString(cents: Cents): string {
  assertInteger(cents, "cents");
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Sum of integer cents. */
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * `percent` of an amount, rounded half up to whole cents.
 * The percentage must be between 0 and 100 with at most 2 decimals (12.5 is fine).
 */
export function percentOf(cents: Cents, percent: number): Cents {
  assertInteger(cents, "cents");
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new RangeError(`Percentage must be between 0 and 100, got ${percent}`);
  }
  const scale = 10 ** MAX_PERCENT_DECIMALS;
  const basisPoints = Math.round(percent * scale);
  if (Math.abs(percent * scale - basisPoints) > FLOAT_NOISE) {
    throw new RangeError(`Percentage has more than ${MAX_PERCENT_DECIMALS} decimal places: ${percent}`);
  }
  const sign = cents < 0 ? -1 : 1;
  const abs = Math.abs(cents);
  const rounded = Math.floor((abs * basisPoints * 2 + 10000) / 20000);
  return sign * rounded === 0 ? 0 : sign * rounded;
}

/**
 * Splits `totalCents` across `weights` so the parts always add up to the total exactly
 * (largest-remainder method; ties go to the earlier position).
 */
export function allocateProportionally(totalCents: Cents, weights: readonly number[]): Cents[] {
  assertInteger(totalCents, "total");
  if (totalCents < 0) throw new RangeError("Cannot allocate a negative total");
  if (weights.length === 0) throw new RangeError("Cannot allocate across zero lines");
  for (const weight of weights) {
    if (!Number.isInteger(weight) || weight < 0) throw new RangeError(`Weights must be non-negative integers, got ${weight}`);
  }
  if (totalCents === 0) return weights.map(() => 0);

  const weightSum = weights.reduce((sum, weight) => sum + BigInt(weight), 0n);
  if (weightSum === 0n) throw new RangeError("Cannot allocate across weights that are all zero");

  const total = BigInt(totalCents);
  const shares = weights.map((weight) => (total * BigInt(weight)) / weightSum);
  const remainders = weights.map((weight, index) => ({ index, remainder: (total * BigInt(weight)) % weightSum }));
  let leftover = Number(total - shares.reduce((sum, share) => sum + share, 0n));

  remainders.sort((a, b) => (a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1));
  const result = shares.map(Number);
  for (const { index } of remainders) {
    if (leftover === 0) break;
    result[index] += 1;
    leftover -= 1;
  }
  return result;
}
