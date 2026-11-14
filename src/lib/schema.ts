import { z } from "zod";
import { FORM_LIMITS } from "@/config/assumptions";
import {
  AUDIENCE_IDS,
  PAIR_KIND_IDS,
  PROJECT_TYPE_IDS,
  PROTOCOL,
  ROUTE_IDS,
} from "@/config/protocol";
import { defaultVirtualTokensM, minVirtualTokensM } from "./curve";
import { OPENING_WINDOW_MS } from "./openingTax";
import { isBaseTaxOption } from "./tax";
import { BPS_DENOMINATOR, formatBps, isDecimalString, parseUnits } from "./units";
import { weightsTotal } from "./weights";

const bps = z.number().int().min(0).max(BPS_DENOMINATOR);

function positiveDecimal(label: string) {
  return z
    .string()
    .refine(isDecimalString, `${label} must be a plain number, like 1 or 0.25.`)
    .refine((s) => !isDecimalString(s) || parseUnits(s) > 0n, `${label} must be greater than zero.`);
}

function optionalDecimal(label: string) {
  return z
    .string()
    .refine(
      (s) => s === "" || isDecimalString(s),
      `${label} must be a plain number, like 0.01, or left empty.`,
    );
}

const weightShape = <K extends string>(keys: readonly K[]) =>
  z.object(Object.fromEntries(keys.map((k) => [k, bps])) as Record<K, typeof bps>);

export const configFields = z.object({
  name: z
    .string()
    .max(
      FORM_LIMITS.nameMaxLength,
      `Token name can be at most ${FORM_LIMITS.nameMaxLength} characters.`,
    ),
  ticker: z
    .string()
    .max(
      FORM_LIMITS.tickerMaxLength,
      `Ticker can be at most ${FORM_LIMITS.tickerMaxLength} characters.`,
    )
    .regex(/^[A-Za-z0-9]*$/, "Ticker can only use letters and numbers."),
  projectType: z.enum(["none", ...PROJECT_TYPE_IDS]),
  pairKind: z.enum(PAIR_KIND_IDS),
  pairSymbol: z
    .string()
    .min(1, "Enter the pair asset's symbol.")
    .max(
      FORM_LIMITS.pairSymbolMaxLength,
      `Pair symbol can be at most ${FORM_LIMITS.pairSymbolMaxLength} characters.`,
    )
    .regex(/^[A-Za-z0-9$.]*$/, "Pair symbol can only use letters, numbers, $ and dots."),
  pairPriceEth: positiveDecimal("Pair value in ETH"),
  taxBps: z
    .number()
    .refine(
      isBaseTaxOption,
      `Base tax must be ${PROTOCOL.tax.baseOptionsBps.value.map((b) => formatBps(b)).join(", ")}.`,
    ),
  weights: weightShape(ROUTE_IDS),
  openingBuyBps: bps,
  airdropBps: bps,
  audience: weightShape(AUDIENCE_IDS),
  creationFeeEth: optionalDecimal("Creation fee"),
  airdropFeeEth: optionalDecimal("Airdrop fee"),
  tradeSize: positiveDecimal("Trade size"),
  virtualTokensM: z
    .number()
    .int("Virtual token reserve must be a whole number of millions.")
    .min(
      minVirtualTokensM(),
      `Virtual token reserve must be at least ${minVirtualTokensM()} million, above the curve allocation.`,
    )
    .max(
      FORM_LIMITS.virtualTokensMaxM,
      `Virtual token reserve can be at most ${FORM_LIMITS.virtualTokensMaxM} million.`,
    ),
  scrubMs: z.number().int().min(0).max(OPENING_WINDOW_MS),
});

export type SimConfig = z.infer<typeof configFields>;
export type ConfigField = keyof SimConfig;

/** Error keys that span more than one field. */
export type CrossFieldError = "allocation";
export type ConfigErrors = Partial<Record<ConfigField | CrossFieldError, string>>;

export const configSchema = configFields.superRefine((config, ctx) => {
  const routeTotal = weightsTotal(config.weights);
  if (routeTotal !== BPS_DENOMINATOR) {
    ctx.addIssue({
      code: "custom",
      path: ["weights"],
      message: `Routing weights total ${formatBps(routeTotal)}. They must use the full project share: exactly 100%.`,
    });
  }

  const cap = PROTOCOL.launch.maxCreatorAllocationBps.value;
  const combined = config.openingBuyBps + config.airdropBps;
  if (combined > cap) {
    ctx.addIssue({
      code: "custom",
      path: ["allocation"],
      message: `Opening buy (${formatBps(config.openingBuyBps)}) plus airdrop reserve (${formatBps(config.airdropBps)}) is ${formatBps(combined)} of supply. Together they cannot exceed ${formatBps(cap)}.`,
    });
  }

  const audienceTotal = weightsTotal(config.audience);
  if (config.airdropBps > 0 && audienceTotal !== BPS_DENOMINATOR) {
    ctx.addIssue({
      code: "custom",
      path: ["audience"],
      message: `Audience split totals ${formatBps(audienceTotal)}. It must add up to exactly 100% of the airdrop reserve.`,
    });
  }
});

function evenSplit<K extends string>(keys: readonly K[]): Record<K, number> {
  const share = Math.floor(BPS_DENOMINATOR / keys.length);
  const result = Object.fromEntries(keys.map((k) => [k, share])) as Record<K, number>;
  const first = keys[0];
  if (first !== undefined) result[first] += BPS_DENOMINATOR - share * keys.length;
  return result;
}

export function defaultConfig(): SimConfig {
  return {
    name: "",
    ticker: "",
    projectType: "none",
    pairKind: "eth",
    pairSymbol: PROTOCOL.network.currency.value,
    pairPriceEth: "1",
    taxBps: PROTOCOL.tax.baseOptionsBps.value[0],
    weights: evenSplit(ROUTE_IDS),
    openingBuyBps: 500,
    airdropBps: 0,
    audience: evenSplit(AUDIENCE_IDS),
    creationFeeEth: "",
    airdropFeeEth: "",
    tradeSize: "1",
    virtualTokensM: defaultVirtualTokensM(),
    scrubMs: OPENING_WINDOW_MS / 2,
  };
}

/** Validates a config and returns one message per field (first issue wins). */
export function validateConfig(config: SimConfig): ConfigErrors {
  const parsed = configSchema.safeParse(config);
  if (parsed.success) return {};
  const errors: ConfigErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0]) as ConfigField | CrossFieldError;
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

export function isValid(errors: ConfigErrors): boolean {
  return Object.keys(errors).length === 0;
}
