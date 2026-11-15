import { describe, expect, it } from "vitest";
import { SITE } from "@/config/site";
import { buildCardData } from "../cardData";
import { defaultConfig } from "../schema";
import { simulate } from "../simulate";
import { buildSummary, displayName } from "../summary";

describe("summary", () => {
  const config = {
    ...defaultConfig(),
    name: "Moon Cat",
    ticker: "mcat",
    taxBps: 200,
    openingBuyBps: 500,
    airdropBps: 300,
  };
  const text = buildSummary(simulate(config), "https://example.test/?v=1");

  it("carries the unofficial label and the link", () => {
    expect(text).toContain(SITE.unofficialLabel);
    expect(text).toContain("https://example.test/?v=1");
  });

  it("states the key numbers", () => {
    expect(text).toContain("Moon Cat ($MCAT)");
    expect(text).toContain("Base tax: 2%");
    expect(text).toContain("Total tax: 0.02 ETH");
    expect(text).toContain("Opening buy: 5% (50,000,000 tokens)");
    expect(text).toContain("Combined: 8% of the 50% limit");
  });

  it("labels model output as an estimate", () => {
    expect(text).toMatch(/Estimates \(model, not protocol data\)/);
  });

  it("keeps allocations apart from the supply split", () => {
    expect(text).toContain("**Your allocations, measured against total supply**");
    expect(text).not.toContain("Bonding curve");
  });

  it("says so when no opening buy is set, with no zero-value estimate", () => {
    const none = buildSummary(simulate(defaultConfig()), "https://example.test/");
    expect(none).toContain("Opening buy: no opening buy set");
    expect(none).toContain("Opening buy cost: no opening buy set");
    expect(none).not.toMatch(/about 0 ETH before tax/);
  });

  it("names untitled tokens sensibly", () => {
    expect(displayName(defaultConfig())).toBe("Untitled token");
    expect(displayName({ ...defaultConfig(), ticker: "abc" })).toBe("$ABC");
  });
});

describe("card data", () => {
  it("shows no cost estimate when no opening buy is set", () => {
    const stat = buildCardData(simulate(defaultConfig())).stats.find(
      (s) => s.label === "Opening-buy cost",
    );
    expect(stat).toEqual({ label: "Opening-buy cost", value: "None set" });
  });

  it("badges the cost as an estimate when an opening buy is set", () => {
    const stat = buildCardData(simulate({ ...defaultConfig(), openingBuyBps: 500 })).stats.find(
      (s) => s.label === "Opening-buy cost",
    );
    expect(stat?.estimate).toBe(true);
    expect(stat?.value).toMatch(/^≈ /);
  });
});

describe("simulate", () => {
  it("costs nothing on the curve when no opening buy is set", () => {
    const sim = simulate(defaultConfig());
    expect(sim.supply.openingBuyTokens).toBe(0n);
    expect(sim.curve.openingBuyCost).toBe(0n);
    expect(sim.costs.knownTotalEth).toBe(0n);
  });

  it("leaves unfilled fees out of the total and lists them as missing", () => {
    const sim = simulate({ ...defaultConfig(), airdropBps: 100 });
    expect(sim.costs.creationFeeEth).toBeNull();
    expect(sim.costs.knownTotalEth).toBe(sim.curve.openingBuyCostEth);
    expect(sim.costs.missing).toEqual(["creation fee", "airdrop fee", "network gas"]);
  });

  it("adds fees once they are filled in", () => {
    const sim = simulate({ ...defaultConfig(), creationFeeEth: "0.01", airdropFeeEth: "0.002" });
    expect(sim.costs.knownTotalEth).toBe(sim.curve.openingBuyCostEth + 12_000_000_000_000_000n);
    expect(sim.costs.missing).toEqual(["network gas"]);
  });

  it("treats ETH pairs as priced at exactly 1 ETH", () => {
    const sim = simulate({ ...defaultConfig(), openingBuyBps: 500, pairPriceEth: "3" });
    expect(sim.curve.openingBuyCost).toBeGreaterThan(0n);
    expect(sim.curve.openingBuyCostEth).toBe(sim.curve.openingBuyCost);
  });
});
