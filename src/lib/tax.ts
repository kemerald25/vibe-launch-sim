import { PROTOCOL, ROUTE_IDS, type RouteId } from "@/config/protocol";
import { applyBps, BPS, BPS_DENOMINATOR } from "./units";
import { weightsAreComplete, weightsTotal } from "./weights";

/** Share of the project share sent to each route, in basis points (must total 10000). */
export type RouteWeights = Record<RouteId, number>;

export interface TaxBreakdown {
  tradeAmount: bigint;
  taxBps: number;
  /** Total base tax taken from the trade. */
  totalTax: bigint;
  /** Protocol's share of the tax. */
  protocolShare: bigint;
  /** Project's share of the tax, before routing. */
  projectShare: bigint;
  /** Project share split across the four routes. Sums exactly to projectShare. */
  routes: Record<RouteId, bigint>;
  /** Trade amount left after tax. */
  netAmount: bigint;
}

export function isBaseTaxOption(bps: number): boolean {
  return (PROTOCOL.tax.baseOptionsBps.value as readonly number[]).includes(bps);
}

/**
 * Splits the base tax on a trade. The project/protocol percentages divide the
 * tax, not the trade. Any rounding dust from routing goes to the route with
 * the largest weight so the parts always sum to the whole.
 */
export function calculateTax(
  tradeAmount: bigint,
  taxBps: number,
  weights: RouteWeights,
): TaxBreakdown {
  if (tradeAmount < 0n) throw new RangeError("Trade amount cannot be negative.");
  if (!isBaseTaxOption(taxBps)) throw new RangeError(`Unsupported base tax: ${taxBps} bps.`);
  if (!weightsAreComplete(weights)) {
    throw new RangeError(
      `Routing weights must total ${BPS_DENOMINATOR} bps, got ${weightsTotal(weights)}.`,
    );
  }

  const totalTax = applyBps(tradeAmount, taxBps);
  const projectShare = applyBps(totalTax, PROTOCOL.tax.projectShareBps.value);
  const protocolShare = totalTax - projectShare;

  const routes = {} as Record<RouteId, bigint>;
  let routed = 0n;
  let largest: RouteId = ROUTE_IDS[0];
  for (const id of ROUTE_IDS) {
    routes[id] = (projectShare * BigInt(weights[id])) / BPS;
    routed += routes[id];
    if (weights[id] > weights[largest]) largest = id;
  }
  routes[largest] += projectShare - routed;

  return {
    tradeAmount,
    taxBps,
    totalTax,
    protocolShare,
    projectShare,
    routes,
    netAmount: tradeAmount - totalTax,
  };
}

/** A route's share of the whole tax, in basis points of the tax. */
export function routeShareOfTaxBps(weightBps: number): number {
  return Math.round((PROTOCOL.tax.projectShareBps.value * weightBps) / BPS_DENOMINATOR);
}
