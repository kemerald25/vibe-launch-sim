import { describe, expect, it } from "vitest";
import { PROTOCOL } from "@/config/protocol";
import { linearDecay, openingBuyOutcome, sampleOpeningTax } from "../openingTax";

describe("opening tax (linear model)", () => {
  it("starts at 99% at second 0", () => {
    for (const base of PROTOCOL.tax.baseOptionsBps.value) {
      expect(linearDecay.rateBpsAt(0, base)).toBe(9900);
    }
  });

  it("is halfway between 99% and the base tax at second 10", () => {
    expect(linearDecay.rateBpsAt(10_000, 100)).toBe(5000);
    expect(linearDecay.rateBpsAt(10_000, 200)).toBe(5050);
    expect(linearDecay.rateBpsAt(10_000, 300)).toBe(5100);
  });

  it("reaches the base tax at second 20 and stays there", () => {
    for (const base of PROTOCOL.tax.baseOptionsBps.value) {
      expect(linearDecay.rateBpsAt(20_000, base)).toBe(base);
      expect(linearDecay.rateBpsAt(60_000, base)).toBe(base);
    }
  });

  it("never rises over time", () => {
    const samples = sampleOpeningTax(200, 250);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]!.rateBps).toBeLessThanOrEqual(samples[i - 1]!.rateBps);
    }
    expect(samples).toHaveLength(81);
  });

  it("reports surcharge and what the buyer receives", () => {
    expect(openingBuyOutcome(0, 200)).toMatchObject({
      rateBps: 9900,
      surchargeBps: 9700,
      receivedBps: 100,
    });
    expect(openingBuyOutcome(10_000, 200)).toMatchObject({
      rateBps: 5050,
      surchargeBps: 4850,
      receivedBps: 4950,
    });
    expect(openingBuyOutcome(20_000, 200)).toMatchObject({
      rateBps: 200,
      surchargeBps: 0,
      receivedBps: 9800,
    });
  });
});
