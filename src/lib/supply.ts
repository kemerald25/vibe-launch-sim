import { AUDIENCE_IDS, PROTOCOL, type AudienceId } from "@/config/protocol";
import { applyBps, BPS } from "./units";
import { weightsAreComplete } from "./weights";

export type AudienceSplit = Record<AudienceId, number>;

export interface SupplyPlan {
  totalSupply: bigint;
  curveSupply: bigint;
  liquiditySupply: bigint;
  curveBps: number;
  liquidityBps: number;
  openingBuyBps: number;
  airdropBps: number;
  openingBuyTokens: bigint;
  airdropTokens: bigint;
  /** Opening buy + airdrop reserve, in bps of total supply. */
  combinedBps: number;
  capBps: number;
  withinCap: boolean;
  /** Room left under the cap. Negative when over. */
  headroomBps: number;
}

/** Whole tokens for a share of total supply given in basis points. */
export function tokensFromBps(bps: number): bigint {
  return applyBps(PROTOCOL.launch.totalSupply.value, bps);
}

export function isWithinCreatorCap(openingBuyBps: number, airdropBps: number): boolean {
  return openingBuyBps + airdropBps <= PROTOCOL.launch.maxCreatorAllocationBps.value;
}

export function planSupply(openingBuyBps: number, airdropBps: number): SupplyPlan {
  const { totalSupply, curveSupply, liquiditySupply, maxCreatorAllocationBps } = PROTOCOL.launch;
  const combinedBps = openingBuyBps + airdropBps;
  return {
    totalSupply: totalSupply.value,
    curveSupply: curveSupply.value,
    liquiditySupply: liquiditySupply.value,
    curveBps: Number((curveSupply.value * BPS) / totalSupply.value),
    liquidityBps: Number((liquiditySupply.value * BPS) / totalSupply.value),
    openingBuyBps,
    airdropBps,
    openingBuyTokens: tokensFromBps(openingBuyBps),
    airdropTokens: tokensFromBps(airdropBps),
    combinedBps,
    capBps: maxCreatorAllocationBps.value,
    withinCap: isWithinCreatorCap(openingBuyBps, airdropBps),
    headroomBps: maxCreatorAllocationBps.value - combinedBps,
  };
}

/** Splits the airdrop reserve across audiences. Dust goes to the largest share. */
export function splitAirdrop(
  airdropTokens: bigint,
  split: AudienceSplit,
): Record<AudienceId, bigint> {
  if (!weightsAreComplete(split)) {
    throw new RangeError("Audience split must total 100%.");
  }
  const result = {} as Record<AudienceId, bigint>;
  let assigned = 0n;
  let largest: AudienceId = AUDIENCE_IDS[0];
  for (const id of AUDIENCE_IDS) {
    result[id] = applyBps(airdropTokens, split[id]);
    assigned += result[id];
    if (split[id] > split[largest]) largest = id;
  }
  result[largest] += airdropTokens - assigned;
  return result;
}
