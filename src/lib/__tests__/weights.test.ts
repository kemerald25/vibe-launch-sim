import { describe, expect, it } from "vitest";
import { rebalanceWeights, weightsAreComplete, weightsTotal } from "../weights";

const keys = ["a", "b", "c", "d"] as const;
type W = Record<(typeof keys)[number], number>;

describe("rebalanceWeights", () => {
  it("keeps the total at 100% for every slider position", () => {
    let weights: W = { a: 2500, b: 2500, c: 2500, d: 2500 };
    for (const key of keys) {
      for (let value = 0; value <= 10000; value += 100) {
        weights = rebalanceWeights(weights, keys, key, value);
        expect(weightsTotal(weights)).toBe(10000);
        expect(weights[key]).toBe(value);
        for (const k of keys) expect(weights[k]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("preserves the proportions of the other weights", () => {
    const result = rebalanceWeights({ a: 4000, b: 3000, c: 2000, d: 1000 }, keys, "a", 7000);
    expect(result).toEqual({ a: 7000, b: 1500, c: 1000, d: 500 });
  });

  it("shares evenly when the others were all zero", () => {
    const result = rebalanceWeights({ a: 10000, b: 0, c: 0, d: 0 }, keys, "a", 7000);
    expect(result).toEqual({ a: 7000, b: 1000, c: 1000, d: 1000 });
  });

  it("clamps out-of-range values", () => {
    expect(rebalanceWeights({ a: 2500, b: 2500, c: 2500, d: 2500 }, keys, "a", 99999).a).toBe(10000);
    expect(rebalanceWeights({ a: 2500, b: 2500, c: 2500, d: 2500 }, keys, "a", -5).a).toBe(0);
  });

  it("detects complete and incomplete weights", () => {
    expect(weightsAreComplete({ a: 5000, b: 5000 })).toBe(true);
    expect(weightsAreComplete({ a: 5000, b: 4900 })).toBe(false);
  });
});
