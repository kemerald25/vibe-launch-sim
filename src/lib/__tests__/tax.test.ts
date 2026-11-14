import { describe, expect, it } from "vitest";
import { PROTOCOL, ROUTE_IDS } from "@/config/protocol";
import { defaultConfig, validateConfig } from "../schema";
import { calculateTax, type RouteWeights } from "../tax";
import { parseUnits } from "../units";

const even: RouteWeights = { treasury: 2500, rewardsPair: 2500, rewardsToken: 2500, burn: 2500 };
const units = (s: string) => parseUnits(s);

describe("calculateTax", () => {
  it("matches the docs' worked example: 2% on a $1,000 trade", () => {
    const result = calculateTax(units("1000"), 200, even);
    expect(result.totalTax).toBe(units("20"));
    expect(result.projectShare).toBe(units("16"));
    expect(result.protocolShare).toBe(units("4"));
    expect(result.netAmount).toBe(units("980"));
  });

  it.each([
    [100, "10", "8", "2"],
    [200, "20", "16", "4"],
    [300, "30", "24", "6"],
  ])("handles the %i bps tax level", (bps, total, project, protocol) => {
    const result = calculateTax(units("1000"), bps, even);
    expect(result.totalTax).toBe(units(total));
    expect(result.projectShare).toBe(units(project));
    expect(result.protocolShare).toBe(units(protocol));
  });

  it("covers every tax option listed in the protocol config", () => {
    expect([...PROTOCOL.tax.baseOptionsBps.value]).toEqual([100, 200, 300]);
  });

  it("rejects a tax level that is not offered", () => {
    expect(() => calculateTax(units("1000"), 250, even)).toThrow(RangeError);
  });

  it("splits the project share by route weights", () => {
    const weights: RouteWeights = {
      treasury: 5000,
      rewardsPair: 2500,
      rewardsToken: 1500,
      burn: 1000,
    };
    const result = calculateTax(units("1000"), 200, weights);
    expect(result.routes.treasury).toBe(units("8"));
    expect(result.routes.rewardsPair).toBe(units("4"));
    expect(result.routes.rewardsToken).toBe(units("2.4"));
    expect(result.routes.burn).toBe(units("1.6"));
  });

  it("sends everything to one route when it has 100%", () => {
    const weights: RouteWeights = { treasury: 0, rewardsPair: 0, rewardsToken: 0, burn: 10000 };
    const result = calculateTax(units("1000"), 200, weights);
    expect(result.routes.burn).toBe(units("16"));
    expect(result.routes.treasury).toBe(0n);
  });

  it("never loses rounding dust: parts always sum to the whole", () => {
    const weights: RouteWeights = {
      treasury: 3300,
      rewardsPair: 3300,
      rewardsToken: 3300,
      burn: 100,
    };
    for (const amount of [1n, 7n, 999n, 123456789n, units("0.333333333333333333")]) {
      const r = calculateTax(amount, 300, weights);
      const routed = ROUTE_IDS.reduce((sum, id) => sum + r.routes[id], 0n);
      expect(routed).toBe(r.projectShare);
      expect(r.projectShare + r.protocolShare).toBe(r.totalTax);
      expect(r.netAmount + r.totalTax).toBe(amount);
    }
  });

  it("throws when weights do not total 100%", () => {
    expect(() => calculateTax(units("1000"), 200, { ...even, burn: 2400 })).toThrow(/must total/);
    expect(() => calculateTax(units("1000"), 200, { ...even, burn: 2600 })).toThrow(/must total/);
  });
});

describe("routing weight validation", () => {
  it("accepts weights that total 100%", () => {
    expect(validateConfig({ ...defaultConfig(), weights: even }).weights).toBeUndefined();
  });

  it("reports weights below 100% with the actual total", () => {
    const errors = validateConfig({ ...defaultConfig(), weights: { ...even, burn: 1500 } });
    expect(errors.weights).toContain("90%");
  });

  it("reports weights above 100% with the actual total", () => {
    const errors = validateConfig({ ...defaultConfig(), weights: { ...even, burn: 3500 } });
    expect(errors.weights).toContain("110%");
  });
});
