/**
 * Values the vibe/vibe docs do NOT publish. Each one is a named assumption
 * that the UI shows with an "estimate" badge. None of these may be presented
 * as fact. See the README section "Unverified assumptions".
 */

export const TRUST_APP_NOTE =
  "This is an estimate. Trust the review screen in the vibe/vibe app over this tool.";

export interface Assumption {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
}

export const ASSUMPTIONS = {
  openingTaxShape: {
    id: "openingTaxShape",
    title: "Shape of the opening-tax decay",
    detail:
      "The docs say the opening rate falls to the base tax over the opening window, but not how. Preflight draws a straight line.",
  },
  curveFormula: {
    id: "curveFormula",
    title: "Bonding-curve price formula",
    detail:
      "The curve formula is not published. Preflight uses a constant-product model with virtual reserves, calibrated so that selling the whole curve allocation raises the graduation target.",
  },
  virtualTokenReserve: {
    id: "virtualTokenReserve",
    title: "Virtual token reserve",
    detail:
      "The constant-product model needs one extra number that the docs do not give. The default assumes the curve's final price equals the starting price of the graduated pool. You can change it under Advanced assumptions.",
  },
  fees: {
    id: "fees",
    title: "Creation fee and airdrop fee",
    detail:
      "Fees are not published and are shown live in the app. Enter them yourself; they are left out of totals until you do. Preflight assumes they are charged in ETH.",
  },
  airdropBucket: {
    id: "airdropBucket",
    title: "Where the airdrop reserve comes from",
    detail:
      "The docs do not say which supply bucket the airdrop reserve reduces. Preflight shows it as a share of total supply only.",
  },
  pairPrice: {
    id: "pairPrice",
    title: "Pair asset price",
    detail: "You enter the pair asset's value in ETH. Preflight does not fetch prices.",
  },
  openingBuyTax: {
    id: "openingBuyTax",
    title: "Base tax on the opening buy",
    detail:
      "The docs exempt the creator's opening buy from the opening surcharge, not from the base tax. Preflight shows the base tax on the estimated cost as a separate line and does not assert whether it is added on top or deducted.",
  },
} as const satisfies Record<string, Assumption>;

export const ASSUMPTION_LIST: readonly Assumption[] = Object.values(ASSUMPTIONS);

/**
 * Thresholds used only to decide when Preflight shows a notice. These are
 * this tool's own choices, not protocol rules.
 */
export const NOTICE_THRESHOLDS = {
  /** Show the "large opening buy" notice above this share of supply (bps). */
  largeOpeningBuyBps: 2_000,
} as const;

/** Cosmetic limits for the form. Not protocol rules. */
export const FORM_LIMITS = {
  nameMaxLength: 32,
  tickerMaxLength: 10,
  pairSymbolMaxLength: 12,
  /** Upper bound for the advanced virtual-reserve input, in millions of tokens. */
  virtualTokensMaxM: 100_000,
} as const;
