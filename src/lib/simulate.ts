import { PROTOCOL, type AudienceId } from "@/config/protocol";
import { ACTIVE_CURVE_MODEL, curveParams } from "./curve";
import { openingBuyOutcome, type OpeningBuyOutcome } from "./openingTax";
import type { SimConfig } from "./schema";
import { planSupply, splitAirdrop, type SupplyPlan } from "./supply";
import { calculateTax, type TaxBreakdown } from "./tax";
import { applyBps, ONE, parseUnits, tryParseUnits } from "./units";

export interface CurveEstimate {
  /** Graduation target in pair-asset units. */
  targetPair: bigint;
  /** Estimated pair-asset cost of the opening buy, before tax. */
  openingBuyCost: bigint;
  /** Base tax on that cost at the chosen rate. */
  openingBuyBaseTax: bigint;
  /** Estimated cost converted to ETH. */
  openingBuyCostEth: bigint;
  /** Curve price after the opening buy relative to the starting price, ×100. */
  priceAfterOpeningBuyX100: bigint;
  /** Curve price at graduation relative to the starting price, ×100. */
  priceAtGraduationX100: bigint;
}

export interface CostSummary {
  creationFeeEth: bigint | null;
  airdropFeeEth: bigint | null;
  /** Sum of the items the user has filled in plus the opening-buy estimate, in ETH. */
  knownTotalEth: bigint;
  /** Items left out of the total. */
  missing: string[];
}

export interface Simulation {
  config: SimConfig;
  pairSymbol: string;
  pairPriceEth: bigint;
  tax: TaxBreakdown;
  supply: SupplyPlan;
  airdropByAudience: Record<AudienceId, bigint> | null;
  opening: OpeningBuyOutcome;
  curve: CurveEstimate;
  costs: CostSummary;
}

export function effectivePairSymbol(config: SimConfig): string {
  return config.pairKind === "eth" ? PROTOCOL.network.currency.value : config.pairSymbol;
}

/** Runs every calculation for a config that has already passed validation. */
export function simulate(config: SimConfig): Simulation {
  const pairPriceEth = config.pairKind === "eth" ? ONE : parseUnits(config.pairPriceEth);
  const tax = calculateTax(parseUnits(config.tradeSize), config.taxBps, config.weights);
  const supply = planSupply(config.openingBuyBps, config.airdropBps);

  const params = curveParams(pairPriceEth, config.virtualTokensM);
  const openingBuyCost = ACTIVE_CURVE_MODEL.costToBuy(supply.openingBuyTokens, params);
  const openingBuyCostEth = (openingBuyCost * pairPriceEth) / ONE;
  const curve: CurveEstimate = {
    targetPair: params.graduationTarget,
    openingBuyCost,
    openingBuyBaseTax: applyBps(openingBuyCost, config.taxBps),
    openingBuyCostEth,
    priceAfterOpeningBuyX100: ACTIVE_CURVE_MODEL.priceMultipleX100(supply.openingBuyTokens, params),
    priceAtGraduationX100: ACTIVE_CURVE_MODEL.priceMultipleX100(params.curveSupply, params),
  };

  const creationFeeEth = tryParseUnits(config.creationFeeEth);
  const airdropFeeEth = tryParseUnits(config.airdropFeeEth);
  const missing: string[] = [];
  if (creationFeeEth === null) missing.push("creation fee");
  if (airdropFeeEth === null && config.airdropBps > 0) missing.push("airdrop fee");
  missing.push("network gas");

  return {
    config,
    pairSymbol: effectivePairSymbol(config),
    pairPriceEth,
    tax,
    supply,
    airdropByAudience:
      config.airdropBps > 0 ? splitAirdrop(supply.airdropTokens, config.audience) : null,
    opening: openingBuyOutcome(config.scrubMs, config.taxBps),
    curve,
    costs: {
      creationFeeEth,
      airdropFeeEth,
      knownTotalEth: openingBuyCostEth + (creationFeeEth ?? 0n) + (airdropFeeEth ?? 0n),
      missing,
    },
  };
}
