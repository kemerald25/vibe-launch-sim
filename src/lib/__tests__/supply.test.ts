import { describe, expect, it } from "vitest";
import { defaultConfig, validateConfig } from "../schema";
import { isWithinCreatorCap, planSupply, splitAirdrop, tokensFromBps } from "../supply";

describe("supply plan", () => {
  it("describes the fixed supply split", () => {
    const plan = planSupply(0, 0);
    expect(plan.totalSupply).toBe(1_000_000_000n);
    expect(plan.curveSupply + plan.liquiditySupply).toBe(plan.totalSupply);
    expect(plan.curveBps).toBe(8000);
    expect(plan.liquidityBps).toBe(2000);
  });

  it("converts basis points of supply to whole tokens", () => {
    expect(tokensFromBps(500)).toBe(50_000_000n);
    expect(tokensFromBps(1)).toBe(100_000n);
  });

  it("is within the cap below the limit", () => {
    const plan = planSupply(2000, 1000);
    expect(plan.withinCap).toBe(true);
    expect(plan.headroomBps).toBe(2000);
  });

  it("is within the cap exactly at the limit", () => {
    const plan = planSupply(3000, 2000);
    expect(plan.combinedBps).toBe(5000);
    expect(plan.withinCap).toBe(true);
    expect(plan.headroomBps).toBe(0);
    expect(isWithinCreatorCap(5000, 0)).toBe(true);
    expect(isWithinCreatorCap(0, 5000)).toBe(true);
  });

  it("is over the cap one basis point above the limit", () => {
    const plan = planSupply(3000, 2001);
    expect(plan.withinCap).toBe(false);
    expect(plan.headroomBps).toBe(-1);
  });
});

describe("50% cap validation", () => {
  const base = defaultConfig();
  it("passes below and at the cap", () => {
    expect(validateConfig({ ...base, openingBuyBps: 2000, airdropBps: 1000 }).allocation).toBeUndefined();
    expect(validateConfig({ ...base, openingBuyBps: 2500, airdropBps: 2500 }).allocation).toBeUndefined();
  });

  it("fails above the cap with both numbers in the message", () => {
    const errors = validateConfig({ ...base, openingBuyBps: 3000, airdropBps: 2500 });
    expect(errors.allocation).toContain("30%");
    expect(errors.allocation).toContain("25%");
    expect(errors.allocation).toContain("55%");
    expect(errors.allocation).toContain("50%");
  });
});

describe("splitAirdrop", () => {
  it("splits tokens across audiences without losing any", () => {
    const split = { fomo: 3333, xCreators: 3333, vibevibe: 3333, spark: 1 };
    const result = splitAirdrop(10_000_001n, split);
    const total = Object.values(result).reduce((a, b) => a + b, 0n);
    expect(total).toBe(10_000_001n);
  });

  it("rejects a split that does not total 100%", () => {
    expect(() => splitAirdrop(100n, { fomo: 5000, xCreators: 0, vibevibe: 0, spark: 0 })).toThrow();
  });

  it("requires the audience split only when there is an airdrop", () => {
    const partial = { fomo: 5000, xCreators: 0, vibevibe: 0, spark: 0 };
    expect(validateConfig({ ...defaultConfig(), airdropBps: 0, audience: partial }).audience).toBeUndefined();
    expect(validateConfig({ ...defaultConfig(), airdropBps: 100, audience: partial }).audience).toContain("50%");
  });
});
