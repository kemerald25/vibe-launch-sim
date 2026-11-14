import { describe, expect, it } from "vitest";
import { defaultConfig, validateConfig, type SimConfig } from "../schema";
import { decodeConfig, encodeConfig, hasConfigParams } from "../urlState";

const custom: SimConfig = {
  name: "Moon Cat & Co",
  ticker: "MCAT",
  projectType: "meme",
  pairKind: "graduated",
  pairSymbol: "$SPARK",
  pairPriceEth: "0.00042",
  taxBps: 300,
  weights: { treasury: 4000, rewardsPair: 3000, rewardsToken: 2000, burn: 1000 },
  openingBuyBps: 1250,
  airdropBps: 375,
  audience: { fomo: 7000, xCreators: 1000, vibevibe: 1000, spark: 1000 },
  creationFeeEth: "0.01",
  airdropFeeEth: "0.002",
  tradeSize: "2500.5",
  virtualTokensM: 1500,
  scrubMs: 7500,
};

describe("URL state", () => {
  it("round-trips the default config", () => {
    const config = defaultConfig();
    expect(decodeConfig(new URLSearchParams(encodeConfig(config)))).toEqual(config);
  });

  it("round-trips a fully customised config", () => {
    const query = encodeConfig(custom);
    expect(decodeConfig(new URLSearchParams(query))).toEqual(custom);
    expect(encodeConfig(decodeConfig(new URLSearchParams(query)))).toBe(query);
  });

  it("round-trips through a plain record, as Next.js provides searchParams", () => {
    const record = Object.fromEntries(new URLSearchParams(encodeConfig(custom)));
    expect(decodeConfig(record)).toEqual(custom);
  });

  it("returns defaults for an empty query", () => {
    expect(decodeConfig(new URLSearchParams(""))).toEqual(defaultConfig());
    expect(hasConfigParams(new URLSearchParams(""))).toBe(false);
    expect(hasConfigParams(new URLSearchParams(encodeConfig(custom)))).toBe(true);
  });

  it("falls back per field when a value is malformed", () => {
    const config = decodeConfig(new URLSearchParams("v=1&tax=250&ob=abc&pp=-1&w=1-2&ty=nope&n=Kept"));
    const defaults = defaultConfig();
    expect(config.taxBps).toBe(defaults.taxBps);
    expect(config.openingBuyBps).toBe(defaults.openingBuyBps);
    expect(config.pairPriceEth).toBe(defaults.pairPriceEth);
    expect(config.weights).toEqual(defaults.weights);
    expect(config.projectType).toBe(defaults.projectType);
    expect(config.name).toBe("Kept");
  });

  it("keeps weights that do not total 100% so the form can explain the error", () => {
    const config = decodeConfig(new URLSearchParams("v=1&w=5000-1000-1000-1000"));
    expect(config.weights.treasury).toBe(5000);
    expect(validateConfig(config).weights).toContain("80%");
  });
});
