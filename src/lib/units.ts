/**
 * Fixed-point helpers. Pair-asset and ETH amounts are bigint with 18 decimals;
 * token amounts are bigint whole tokens; percentages are integer basis points.
 * Nothing in src/lib uses floating point for money.
 */

export const DECIMALS = 18;
export const ONE = 10n ** BigInt(DECIMALS);
export const BPS_DENOMINATOR = 10_000;
export const BPS = BigInt(BPS_DENOMINATOR);

const DECIMAL_RE = /^\d{1,15}(\.\d{1,18})?$/;

/** True for plain non-negative decimals like "1", "0.25", "1000.5". */
export function isDecimalString(input: string): boolean {
  return DECIMAL_RE.test(input.trim());
}

/** Parses a decimal string into 18-decimal fixed point. Throws on bad input. */
export function parseUnits(input: string): bigint {
  const s = input.trim();
  if (!DECIMAL_RE.test(s)) throw new RangeError(`Not a decimal amount: "${input}"`);
  const [whole = "0", frac = ""] = s.split(".");
  return BigInt(whole) * ONE + BigInt(frac.padEnd(DECIMALS, "0"));
}

/** Like parseUnits but returns null for empty or invalid input. */
export function tryParseUnits(input: string): bigint | null {
  return isDecimalString(input) ? parseUnits(input) : null;
}

function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Formats 18-decimal fixed point, rounded half-up to `maxFractionDigits`. */
export function formatUnits(value: bigint, maxFractionDigits = 6): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const scale = 10n ** BigInt(DECIMALS - maxFractionDigits);
  const rounded = (abs + scale / 2n) / scale;
  if (rounded === 0n && abs > 0n) {
    return `<0.${"0".repeat(maxFractionDigits - 1)}1`;
  }
  const base = 10n ** BigInt(maxFractionDigits);
  const whole = group((rounded / base).toString());
  const frac = (rounded % base).toString().padStart(maxFractionDigits, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/** Picks a sensible precision for display: fewer decimals for larger amounts. */
export function formatAmount(value: bigint): string {
  const abs = value < 0n ? -value : value;
  if (abs >= 1_000n * ONE) return formatUnits(value, 2);
  if (abs >= ONE) return formatUnits(value, 4);
  return formatUnits(value, 6);
}

/** Formats whole tokens with thousands separators. */
export function formatTokens(tokens: bigint): string {
  return group(tokens.toString());
}

/** Formats basis points as a percentage: 250 -> "2.5%". */
export function formatBps(bps: number | bigint): string {
  const n = BigInt(bps);
  const negative = n < 0n;
  const abs = negative ? -n : n;
  const whole = group((abs / 100n).toString());
  const frac = (abs % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}%`;
}

/** Formats a ratio scaled by 100 as a multiple: 1625n -> "16.25×". */
export function formatMultiple(x100: bigint): string {
  const whole = group((x100 / 100n).toString());
  const frac = (x100 % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return `${whole}${frac ? `.${frac}` : ""}×`;
}

/** value * bps / 10000, rounded down. */
export function applyBps(value: bigint, bps: number | bigint): bigint {
  return (value * BigInt(bps)) / BPS;
}
