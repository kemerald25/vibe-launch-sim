import { PROTOCOL } from "@/config/protocol";
import { BPS_DENOMINATOR } from "./units";

/**
 * ESTIMATE. The docs say the opening buy rate falls from the start rate to
 * the base tax over the opening window, but not the shape of the fall. Each
 * shape is an `OpeningTaxModel`; swap `ACTIVE_OPENING_TAX_MODEL` to change it.
 */
export interface OpeningTaxModel {
  readonly id: string;
  readonly label: string;
  /** Buy tax rate in bps at `elapsedMs` after launch, for the given base tax. */
  rateBpsAt(elapsedMs: number, baseTaxBps: number): number;
}

export const OPENING_WINDOW_MS = PROTOCOL.tax.openingWindowSeconds.value * 1000;

export const linearDecay: OpeningTaxModel = {
  id: "linear",
  label: "Straight-line fall",
  rateBpsAt(elapsedMs, baseTaxBps) {
    const start = PROTOCOL.tax.openingStartRateBps.value;
    if (elapsedMs <= 0) return start;
    if (elapsedMs >= OPENING_WINDOW_MS) return baseTaxBps;
    const fallen = Math.round(((start - baseTaxBps) * elapsedMs) / OPENING_WINDOW_MS);
    return start - fallen;
  },
};

export const ACTIVE_OPENING_TAX_MODEL: OpeningTaxModel = linearDecay;

export interface OpeningBuyOutcome {
  elapsedMs: number;
  /** Total buy tax at this moment. */
  rateBps: number;
  /** Part of the rate above the base tax. Goes to the protocol. */
  surchargeBps: number;
  /** Share of the purchase the buyer keeps after tax. */
  receivedBps: number;
}

export function openingBuyOutcome(
  elapsedMs: number,
  baseTaxBps: number,
  model: OpeningTaxModel = ACTIVE_OPENING_TAX_MODEL,
): OpeningBuyOutcome {
  const rateBps = model.rateBpsAt(elapsedMs, baseTaxBps);
  return {
    elapsedMs,
    rateBps,
    surchargeBps: rateBps - baseTaxBps,
    receivedBps: BPS_DENOMINATOR - rateBps,
  };
}

/** Evenly spaced samples across the opening window, for charts and tables. */
export function sampleOpeningTax(
  baseTaxBps: number,
  stepMs = 500,
  model: OpeningTaxModel = ACTIVE_OPENING_TAX_MODEL,
): OpeningBuyOutcome[] {
  const samples: OpeningBuyOutcome[] = [];
  for (let t = 0; t <= OPENING_WINDOW_MS; t += stepMs) {
    samples.push(openingBuyOutcome(t, baseTaxBps, model));
  }
  return samples;
}
