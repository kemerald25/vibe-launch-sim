import { describe, expect, it } from "vitest";
import {
  constantProduct,
  curveParams,
  defaultVirtualTokensM,
  graduationTargetInPair,
  minVirtualTokensM,
} from "../curve";
import { ONE, parseUnits } from "../units";

const params = curveParams(ONE, defaultVirtualTokensM());

describe("constant-product curve model (estimate)", () => {
  it("is calibrated so selling the whole curve raises the graduation target", () => {
    expect(constantProduct.costToBuy(params.curveSupply, params)).toBe(params.graduationTarget);
    expect(params.graduationTarget).toBe(parseUnits("4"));
  });

  it("stays calibrated for any virtual reserve", () => {
    for (const vt of [minVirtualTokensM(), 900, 2000, 50_000]) {
      const p = curveParams(ONE, vt);
      expect(constantProduct.costToBuy(p.curveSupply, p)).toBe(p.graduationTarget);
    }
  });

  it("costs nothing to buy nothing and rises with size", () => {
    expect(constantProduct.costToBuy(0n, params)).toBe(0n);
    const small = constantProduct.costToBuy(10_000_000n, params);
    const large = constantProduct.costToBuy(100_000_000n, params);
    expect(small).toBeGreaterThan(0n);
    expect(large).toBeGreaterThan(small * 10n);
  });

  it("reports the price multiple relative to the start", () => {
    expect(constantProduct.priceMultipleX100(0n, params)).toBe(100n);
    expect(constantProduct.priceMultipleX100(params.curveSupply, params)).toBeGreaterThan(1500n);
  });

  it("rejects impossible inputs", () => {
    expect(() => constantProduct.costToBuy(params.curveSupply + 1n, params)).toThrow(RangeError);
    expect(() =>
      constantProduct.costToBuy(1n, { ...params, virtualTokens: params.curveSupply }),
    ).toThrow(RangeError);
  });

  it("derives the default virtual reserve from the supply split", () => {
    expect(defaultVirtualTokensM()).toBe(1067);
    expect(minVirtualTokensM()).toBe(801);
  });

  it("converts the target into pair units", () => {
    expect(graduationTargetInPair(parseUnits("2"))).toBe(parseUnits("2"));
    expect(graduationTargetInPair(parseUnits("0.5"))).toBe(parseUnits("8"));
    expect(() => graduationTargetInPair(0n)).toThrow(RangeError);
  });
});
