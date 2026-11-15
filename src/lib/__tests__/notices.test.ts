import { describe, expect, it } from "vitest";
import { evaluateNotices, NOTICE_RULES } from "@/config/notices";
import { defaultConfig, type SimConfig } from "../schema";

const ids = (config: SimConfig) => evaluateNotices(config).map((n) => n.id);
const base = defaultConfig();

describe("notice rules", () => {
  it("have unique ids", () => {
    const all = NOTICE_RULES.map((r) => r.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("always show the standing facts", () => {
    expect(ids(base)).toEqual(
      expect.arrayContaining(["no-refund", "liquidity-locked", "testnet-no-value"]),
    );
  });

  it("flags tax only at the 3% maximum", () => {
    expect(ids({ ...base, taxBps: 100 })).not.toContain("tax-at-maximum");
    expect(ids({ ...base, taxBps: 200 })).not.toContain("tax-at-maximum");
    expect(ids({ ...base, taxBps: 300 })).toContain("tax-at-maximum");
  });

  it("flags an opening buy above 20% of supply, not at it", () => {
    expect(ids({ ...base, openingBuyBps: 2000 })).not.toContain("large-opening-buy");
    expect(ids({ ...base, openingBuyBps: 2001 })).toContain("large-opening-buy");
  });

  it("flags a fully used allocation limit", () => {
    expect(ids({ ...base, openingBuyBps: 3000, airdropBps: 2000 })).toContain("allocation-at-cap");
    expect(ids({ ...base, openingBuyBps: 3000, airdropBps: 1999 })).not.toContain(
      "allocation-at-cap",
    );
  });

  it("flags 100% of the project share going to one route and names it", () => {
    const config = {
      ...base,
      weights: { treasury: 0, rewardsPair: 0, rewardsToken: 0, burn: 10000 },
    };
    const notice = evaluateNotices(config).find((n) => n.id === "single-route");
    expect(notice?.body).toContain("token burn");
    expect(ids(base)).not.toContain("single-route");
  });

  it("explains token rewards only when they are used", () => {
    expect(ids(base)).toContain("token-rewards-after-graduation");
    const none = {
      ...base,
      weights: { treasury: 10000, rewardsPair: 0, rewardsToken: 0, burn: 0 },
    };
    expect(ids(none)).not.toContain("token-rewards-after-graduation");
    expect(ids(none)).not.toContain("pair-rewards-pull-based");
  });

  it("flags a zero treasury weight", () => {
    const config = {
      ...base,
      weights: { treasury: 0, rewardsPair: 5000, rewardsToken: 5000, burn: 0 },
    };
    expect(ids(config)).toContain("no-treasury");
    expect(ids(base)).not.toContain("no-treasury");
  });

  it("explains the airdrop condition only when supply is reserved", () => {
    expect(ids({ ...base, airdropBps: 0 })).not.toContain("airdrop-needs-graduation");
    expect(ids({ ...base, airdropBps: 100 })).toContain("airdrop-needs-graduation");
  });

  it("flags stacked tax only for graduated-token pairs", () => {
    expect(ids(base)).not.toContain("paired-token-tax");
    expect(ids({ ...base, pairKind: "graduated", pairSymbol: "ABC" })).toContain(
      "paired-token-tax",
    );
    expect(ids({ ...base, pairKind: "stock", pairSymbol: "ABC" })).not.toContain(
      "paired-token-tax",
    );
  });

  it("explains the fixed target for non-ETH pairs", () => {
    expect(ids(base)).not.toContain("target-fixed-in-pair-units");
    expect(ids({ ...base, pairKind: "stock", pairSymbol: "ABC" })).toContain(
      "target-fixed-in-pair-units",
    );
  });

  it("never gives advice", () => {
    const everything: SimConfig = {
      ...base,
      taxBps: 300,
      pairKind: "graduated",
      pairSymbol: "ABC",
      openingBuyBps: 3000,
      airdropBps: 2000,
    };
    const text = evaluateNotices(everything)
      .map((n) => `${n.title} ${n.body}`)
      .join(" ");
    expect(text).not.toMatch(
      /\b(should|recommend|safe|risky|profit|good|bad|best|worst|consider)\b/i,
    );
  });
});
