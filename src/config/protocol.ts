/**
 * Single source of truth for every vibe/vibe protocol fact used by Preflight.
 *
 * Rules:
 *  - Every value here was read from the vibe/vibe testnet documentation on the
 *    `verifiedOn` date. Nothing in this file is an estimate.
 *  - No protocol number may be hard-coded anywhere else in the codebase.
 *  - Anything the docs do NOT state lives in `src/config/assumptions.ts`
 *    and is shown in the UI as an editable estimate.
 *
 * When testnet rules change: update the value, its `source`, and `VERIFIED_ON`,
 * then run `pnpm test`. See the README for the full checklist.
 */

export const VERIFIED_ON = "2026-11-14";

export const DOCS_URL = "https://testnet.vibevibe.fun/docs/";

export interface Fact<T> {
  readonly value: T;
  /** Section of the official docs the value was read from. */
  readonly source: string;
  /** ISO date the value was last checked against the docs. */
  readonly verifiedOn: string;
}

function fact<T>(value: T, source: string): Fact<T> {
  return { value, source, verifiedOn: VERIFIED_ON };
}

export const ROUTE_IDS = ["treasury", "rewardsPair", "rewardsToken", "burn"] as const;
export type RouteId = (typeof ROUTE_IDS)[number];

export const AUDIENCE_IDS = ["fomo", "xCreators", "vibevibe", "spark"] as const;
export type AudienceId = (typeof AUDIENCE_IDS)[number];

export const PROJECT_TYPE_IDS = ["meme", "product", "rwa"] as const;
export type ProjectTypeId = (typeof PROJECT_TYPE_IDS)[number];

export const PAIR_KIND_IDS = ["eth", "stock", "ecosystem", "graduated"] as const;
export type PairKindId = (typeof PAIR_KIND_IDS)[number];

export const LOCKED_SETTING_IDS = [
  "pair",
  "tax",
  "weights",
  "target",
  "holderBooks",
  "airdrop",
] as const;
export type LockedSettingId = (typeof LOCKED_SETTING_IDS)[number];

export const PROTOCOL = {
  network: {
    name: fact("Robinhood Chain Testnet", "Network"),
    chainId: fact(46630, "Network"),
    currency: fact("ETH", "Network"),
    rpcUrl: fact("https://rpc.testnet.chain.robinhood.com", "Network"),
    explorer: fact("explorer.testnet.chain.robinhood.com", "Network"),
    faucet: fact("faucet.testnet.chain.robinhood.com", "Network"),
    noMonetaryValue: fact(true, "Network"),
  },

  launch: {
    flowVersion: fact("V6", "Launch"),
    /** Whole tokens. */
    totalSupply: fact(1_000_000_000n, "Launch"),
    curveSupply: fact(800_000_000n, "Launch"),
    liquiditySupply: fact(200_000_000n, "Launch"),
    projectTypes: fact(
      {
        meme: "Meme & Artcoins",
        product: "Product & Utility",
        rwa: "RWA & Stocks",
      } satisfies Record<ProjectTypeId, string>,
      "Launch",
    ),
    pairKinds: fact(
      {
        eth: "ETH",
        stock: "Stock-labelled test asset",
        ecosystem: "Ecosystem token",
        graduated: "Graduated vibe/vibe token",
      } satisfies Record<PairKindId, string>,
      "Launch",
    ),
    /**
     * The target is fixed in the pair asset's units at creation. The app
     * describes it as approximately this many ETH of value.
     */
    graduationTargetApproxEth: fact(4n, "Launch"),
    graduationVenue: fact("Uniswap v4", "Launch"),
    liquidityLockedPermanently: fact(true, "Launch"),
    noRefundOrExpiry: fact(true, "Launch"),
    /** Opening buy + graduation-airdrop allocation, in bps of total supply. */
    maxCreatorAllocationBps: fact(5_000, "Launch"),
    lockedSettings: fact(LOCKED_SETTING_IDS, "Launch"),
    launchCostItems: fact(
      ["Creation fee", "Airdrop fee (if any)", "Opening purchase", "Network gas"] as const,
      "Launch",
    ),
  },

  tax: {
    /** Base project tax options in bps, applied to buys and sells. */
    baseOptionsBps: fact([100, 200, 300] as const, "Tax"),
    openingWindowSeconds: fact(20, "Tax"),
    openingStartRateBps: fact(9_900, "Tax"),
    /** The base tax splits into these shares. They divide the tax, not the trade. */
    projectShareBps: fact(8_000, "Tax"),
    protocolShareBps: fact(2_000, "Tax"),
    /** Worked example given in the docs: a 2% tax on a $1,000 trade. */
    workedExample: fact({ tradeUsd: 1_000, taxBps: 200 }, "Tax"),
    routes: fact(
      {
        treasury: { label: "Project treasury", short: "Treasury", paidIn: "pair" },
        rewardsPair: {
          label: "Holder rewards (pair asset)",
          short: "Rewards · pair",
          paidIn: "pair",
        },
        rewardsToken: {
          label: "Holder rewards (launched token)",
          short: "Rewards · token",
          paidIn: "token",
        },
        burn: { label: "Token burn", short: "Burn", paidIn: "token" },
      } satisfies Record<RouteId, { label: string; short: string; paidIn: "pair" | "token" }>,
      "Tax",
    ),
  },

  airdrop: {
    audiences: fact(
      {
        fomo: "Opt-in Fomo traders",
        xCreators: "Opt-in X creators",
        vibevibe: "$VIBEVIBE holders",
        spark: "$SPARK holders",
      } satisfies Record<AudienceId, string>,
      "Graduation airdrops",
    ),
    onlyOnGraduation: fact(true, "Graduation airdrops"),
  },
} as const;

/** Flat list of facts for the About page's sources table. */
export const FACT_SOURCES: readonly { label: string; value: string; source: string }[] = [
  {
    label: "Network",
    value: `${PROTOCOL.network.name.value}, chain ID ${PROTOCOL.network.chainId.value}`,
    source: PROTOCOL.network.name.source,
  },
  {
    label: "Total supply",
    value: `${PROTOCOL.launch.totalSupply.value.toLocaleString("en-US")} tokens`,
    source: PROTOCOL.launch.totalSupply.source,
  },
  {
    label: "Bonding curve allocation",
    value: `${PROTOCOL.launch.curveSupply.value.toLocaleString("en-US")} tokens`,
    source: PROTOCOL.launch.curveSupply.source,
  },
  {
    label: "Graduated liquidity",
    value: `${PROTOCOL.launch.liquiditySupply.value.toLocaleString("en-US")} tokens`,
    source: PROTOCOL.launch.liquiditySupply.source,
  },
  {
    label: "Graduation target",
    value: `Fixed in pair units; approximately ${PROTOCOL.launch.graduationTargetApproxEth.value} ETH of value`,
    source: PROTOCOL.launch.graduationTargetApproxEth.source,
  },
  {
    label: "Opening buy + airdrop limit",
    value: `${PROTOCOL.launch.maxCreatorAllocationBps.value / 100}% of supply`,
    source: PROTOCOL.launch.maxCreatorAllocationBps.source,
  },
  {
    label: "Base tax options",
    value: PROTOCOL.tax.baseOptionsBps.value.map((b) => `${b / 100}%`).join(", "),
    source: PROTOCOL.tax.baseOptionsBps.source,
  },
  {
    label: "Tax split",
    value: `${PROTOCOL.tax.projectShareBps.value / 100}% project, ${PROTOCOL.tax.protocolShareBps.value / 100}% protocol`,
    source: PROTOCOL.tax.projectShareBps.source,
  },
  {
    label: "Opening rate",
    value: `${PROTOCOL.tax.openingStartRateBps.value / 100}% falling to base over ${PROTOCOL.tax.openingWindowSeconds.value} seconds`,
    source: PROTOCOL.tax.openingStartRateBps.source,
  },
  {
    label: "Airdrop audiences",
    value: Object.values(PROTOCOL.airdrop.audiences.value).join(", "),
    source: PROTOCOL.airdrop.audiences.source,
  },
];
