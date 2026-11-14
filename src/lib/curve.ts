import { PROTOCOL } from "@/config/protocol";
import { ONE } from "./units";

/**
 * ESTIMATE. The real bonding-curve formula is not published. Everything in
 * this file is a model used only to estimate opening-buy cost and price
 * impact. Implement `CurveModel` and change `ACTIVE_CURVE_MODEL` to swap it.
 */
export interface CurveParams {
  /** Whole tokens sold through the curve. */
  curveSupply: bigint;
  /** Pair-asset amount (18 decimals) raised when the whole curve is sold. */
  graduationTarget: bigint;
  /** Model parameter: virtual token reserve at launch, in whole tokens. */
  virtualTokens: bigint;
}

export interface CurveModel {
  readonly id: string;
  readonly label: string;
  /** Pair-asset cost (18 decimals) of buying `tokens` from an untouched curve, before tax. */
  costToBuy(tokens: bigint, params: CurveParams): bigint;
  /** Spot price after `tokens` are sold divided by the starting price, scaled by 100. */
  priceMultipleX100(tokens: bigint, params: CurveParams): bigint;
}

function assertParams(tokens: bigint, p: CurveParams): void {
  if (p.virtualTokens <= p.curveSupply) {
    throw new RangeError("Virtual token reserve must be larger than the curve allocation.");
  }
  if (tokens < 0n || tokens > p.curveSupply) {
    throw new RangeError("Token amount must be between zero and the curve allocation.");
  }
}

/**
 * Constant product with virtual reserves: (Vt - sold) * (Vp + raised) = Vt * Vp.
 * Vp is not a free parameter: it is solved so that selling the whole curve
 * allocation raises exactly the graduation target:
 *   Vp = target * (Vt - curve) / curve
 * which gives
 *   cost(d) = target * (Vt - curve) * d / (curve * (Vt - d))
 */
export const constantProduct: CurveModel = {
  id: "constant-product",
  label: "Constant product with virtual reserves",
  costToBuy(tokens, p) {
    assertParams(tokens, p);
    const numerator = p.graduationTarget * (p.virtualTokens - p.curveSupply) * tokens;
    const denominator = p.curveSupply * (p.virtualTokens - tokens);
    // Round up: a buyer never pays less than the exact amount.
    return (numerator + denominator - 1n) / denominator;
  },
  priceMultipleX100(tokens, p) {
    assertParams(tokens, p);
    const left = p.virtualTokens - tokens;
    return (p.virtualTokens * p.virtualTokens * 100n) / (left * left);
  },
};

export const ACTIVE_CURVE_MODEL: CurveModel = constantProduct;

const MILLION = 1_000_000n;

/**
 * Default virtual token reserve, in millions of tokens. Derived (not read
 * from the docs) by assuming price continuity at graduation: the curve's
 * final price equals target / graduated-liquidity tokens. That gives
 * Vt = curve² / (curve - liquidity).
 */
export function defaultVirtualTokensM(): number {
  const curve = PROTOCOL.launch.curveSupply.value;
  const liquidity = PROTOCOL.launch.liquiditySupply.value;
  const exact = (curve * curve) / (curve - liquidity);
  return Number((exact + MILLION / 2n) / MILLION);
}

/** Smallest valid virtual reserve input, in millions of tokens. */
export function minVirtualTokensM(): number {
  return Number(PROTOCOL.launch.curveSupply.value / MILLION) + 1;
}

/** Graduation target in pair-asset units, given the pair asset's ETH value (18 decimals). */
export function graduationTargetInPair(pairPriceEth: bigint): bigint {
  if (pairPriceEth <= 0n) throw new RangeError("Pair price must be greater than zero.");
  return (PROTOCOL.launch.graduationTargetApproxEth.value * ONE * ONE) / pairPriceEth;
}

export function curveParams(pairPriceEth: bigint, virtualTokensM: number): CurveParams {
  return {
    curveSupply: PROTOCOL.launch.curveSupply.value,
    graduationTarget: graduationTargetInPair(pairPriceEth),
    virtualTokens: BigInt(virtualTokensM) * MILLION,
  };
}
