import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatBps,
  formatMultiple,
  formatTokens,
  formatUnits,
  isDecimalString,
  ONE,
  parseUnits,
  tryParseUnits,
} from "../units";

describe("units", () => {
  it("parses decimal strings exactly", () => {
    expect(parseUnits("1")).toBe(ONE);
    expect(parseUnits("0.1")).toBe(ONE / 10n);
    expect(parseUnits("1000.000000000000000001")).toBe(1000n * ONE + 1n);
    expect(parseUnits(" 2.5 ")).toBe((ONE * 5n) / 2n);
  });

  it("rejects anything that is not a plain decimal", () => {
    for (const bad of ["", "-1", "1e5", "abc", "1.", ".5", "1,000", "1.0000000000000000001"]) {
      expect(isDecimalString(bad)).toBe(false);
      expect(tryParseUnits(bad)).toBeNull();
    }
    expect(() => parseUnits("-1")).toThrow(RangeError);
  });

  it("formats with grouping, rounding, and trimmed zeros", () => {
    expect(formatUnits(parseUnits("1234567.5"))).toBe("1,234,567.5");
    expect(formatUnits(parseUnits("0.1234567"))).toBe("0.123457");
    expect(formatUnits(parseUnits("20"))).toBe("20");
    expect(formatUnits(1n)).toBe("<0.000001");
    expect(formatUnits(0n)).toBe("0");
  });

  it("chooses precision by size", () => {
    expect(formatAmount(parseUnits("12345.6789"))).toBe("12,345.68");
    expect(formatAmount(parseUnits("12.345678"))).toBe("12.3457");
    expect(formatAmount(parseUnits("0.0123456789"))).toBe("0.012346");
  });

  it("formats basis points, tokens, and multiples", () => {
    expect(formatBps(200)).toBe("2%");
    expect(formatBps(5050)).toBe("50.5%");
    expect(formatBps(1)).toBe("0.01%");
    expect(formatBps(10000)).toBe("100%");
    expect(formatTokens(800_000_000n)).toBe("800,000,000");
    expect(formatMultiple(1625n)).toBe("16.25×");
    expect(formatMultiple(100n)).toBe("1×");
  });
});
