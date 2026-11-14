import { describe, expect, it } from "vitest";
import { SITE } from "@/config/site";
import { defaultConfig } from "../schema";
import { simulate } from "../simulate";
import { buildSummary, displayName } from "../summary";

describe("summary", () => {
  const config = { ...defaultConfig(), name: "Moon Cat", ticker: "mcat", taxBps: 200, airdropBps: 300 };
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

  it("names untitled tokens sensibly", () => {
    expect(displayName(defaultConfig())).toBe("Untitled token");
    expect(displayName({ ...defaultConfig(), ticker: "abc" })).toBe("$ABC");
  });
});

describe("simulate", () => {
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
    const sim = simulate({ ...defaultConfig(), pairPriceEth: "3" });
    expect(sim.curve.openingBuyCostEth).toBe(sim.curve.openingBuyCost);
  });
});
