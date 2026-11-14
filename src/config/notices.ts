import { NOTICE_THRESHOLDS } from "@/config/assumptions";
import { PROTOCOL, ROUTE_IDS } from "@/config/protocol";
import type { SimConfig } from "@/lib/schema";
import { BPS_DENOMINATOR, formatBps } from "@/lib/units";

/**
 * "Things to know" rules. Each rule states a fact and its consequence for the
 * current settings. Rules never judge a configuration as good, safe, or
 * profitable. Add a rule here and a test in src/lib/__tests__/notices.test.ts.
 */
export interface NoticeRule {
  readonly id: string;
  readonly title: string;
  when(config: SimConfig): boolean;
  body(config: SimConfig): string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
}

const { tax, launch, airdrop, network } = PROTOCOL;
const routes = tax.routes.value;
const maxTaxBps = Math.max(...tax.baseOptionsBps.value);

export const NOTICE_RULES: readonly NoticeRule[] = [
  {
    id: "tax-at-maximum",
    title: "Tax is at the maximum",
    when: (c) => c.taxBps === maxTaxBps,
    body: (c) =>
      `Base tax is ${formatBps(c.taxBps)}, the highest option. It applies to every buy and every sell, and it cannot be changed after launch.`,
  },
  {
    id: "large-opening-buy",
    title: "Large opening buy",
    when: (c) => c.openingBuyBps > NOTICE_THRESHOLDS.largeOpeningBuyBps,
    body: (c) =>
      `The opening buy is ${formatBps(c.openingBuyBps)} of total supply, bought by the creator in the launch transaction. The opening purchase is one of the launch costs.`,
  },
  {
    id: "allocation-at-cap",
    title: "Allocation limit fully used",
    when: (c) => c.openingBuyBps + c.airdropBps === launch.maxCreatorAllocationBps.value,
    body: () =>
      `Opening buy plus airdrop reserve uses the full ${formatBps(launch.maxCreatorAllocationBps.value)} limit. Neither can be raised without lowering the other.`,
  },
  {
    id: "single-route",
    title: "All of the project share goes to one route",
    when: (c) => ROUTE_IDS.some((id) => c.weights[id] === BPS_DENOMINATOR),
    body: (c) => {
      const id = ROUTE_IDS.find((r) => c.weights[r] === BPS_DENOMINATOR) ?? ROUTE_IDS[0];
      return `100% of the project share is routed to ${routes[id].label.toLowerCase()}. The other three routes receive nothing, and weights cannot be changed after launch.`;
    },
  },
  {
    id: "no-treasury",
    title: "Nothing is routed to the treasury",
    when: (c) => c.weights.treasury === 0,
    body: () =>
      "The project treasury weight is 0%, so the treasury receives no part of the tax. Weights cannot be changed after launch.",
  },
  {
    id: "token-rewards-after-graduation",
    title: "Token rewards wait for graduation",
    when: (c) => c.weights.rewardsToken > 0,
    body: (c) =>
      `${formatBps(c.weights.rewardsToken)} of the project share goes to holder rewards paid in the launched token. These accumulate from trading and only become claimable after graduation. Holders must claim them; nothing is sent automatically.`,
  },
  {
    id: "pair-rewards-pull-based",
    title: "Pair-asset rewards must be claimed",
    when: (c) => c.weights.rewardsPair > 0,
    body: (c) =>
      `${formatBps(c.weights.rewardsPair)} of the project share goes to holder rewards paid in the pair asset. These can be collected on the curve or after graduation, but holders must claim them; nothing is sent automatically.`,
  },
  {
    id: "airdrop-needs-graduation",
    title: "Airdrop only happens at graduation",
    when: (c) => c.airdropBps > 0,
    body: (c) =>
      `${formatBps(c.airdropBps)} of supply is reserved for a graduation airdrop. ${airdrop.onlyOnGraduation.value ? "Distribution only happens if the token completes its curve." : ""} Recipients are selected before trading begins, and the campaign, audience allocation, and shortlist cannot be changed afterwards.`,
  },
  {
    id: "paired-token-tax",
    title: "The paired token's tax can stack",
    when: (c) => c.pairKind === "graduated",
    body: () =>
      "This token is paired against another graduated vibe/vibe token. Trades can also incur that paired token's own tax, on top of this token's tax.",
  },
  {
    id: "target-fixed-in-pair-units",
    title: "Graduation target is fixed in pair units",
    when: (c) => c.pairKind !== "eth",
    body: (c) =>
      `The graduation target is set in ${c.pairSymbol} units at creation and does not change afterwards. If the ETH value of ${c.pairSymbol} moves, the ETH value of the target moves with it.`,
  },
  {
    id: "no-refund",
    title: "No refund if the curve never completes",
    when: () => launch.noRefundOrExpiry.value,
    body: () =>
      "There is no automatic refund, no expiry, and no guaranteed graduation. If the token never completes its curve, it stays on the curve.",
  },
  {
    id: "liquidity-locked",
    title: "Liquidity is locked at graduation",
    when: () => launch.liquidityLockedPermanently.value,
    body: () =>
      `Graduation happens inside the buy that completes the curve. Trading then moves to a ${launch.graduationVenue.value} pool and the liquidity position is permanently locked.`,
  },
  {
    id: "testnet-no-value",
    title: "Testnet only",
    when: () => network.noMonetaryValue.value,
    body: () =>
      `${network.name.value} ${network.currency.value} and tokens have no monetary value.`,
  },
];

export function evaluateNotices(config: SimConfig): Notice[] {
  return NOTICE_RULES.filter((rule) => rule.when(config)).map((rule) => ({
    id: rule.id,
    title: rule.title,
    body: rule.body(config).replace(/\s+/g, " ").trim(),
  }));
}
