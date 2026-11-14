import { AUDIENCE_IDS, ROUTE_IDS } from "@/config/protocol";
import { configFields, defaultConfig, type ConfigField, type SimConfig } from "./schema";

/**
 * The whole simulation lives in the query string so any link reproduces it.
 * Keys are short to keep Discord links tidy. `v` is the format version.
 */
export const URL_STATE_VERSION = "1";

const KEYS = {
  name: "n",
  ticker: "t",
  projectType: "ty",
  pairKind: "pk",
  pairSymbol: "ps",
  pairPriceEth: "pp",
  taxBps: "tax",
  weights: "w",
  openingBuyBps: "ob",
  airdropBps: "ad",
  audience: "au",
  creationFeeEth: "cf",
  airdropFeeEth: "af",
  tradeSize: "ts",
  virtualTokensM: "vt",
  scrubMs: "s",
} as const satisfies Record<ConfigField, string>;

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function joinWeights<K extends string>(keys: readonly K[], weights: Record<K, number>): string {
  return keys.map((k) => weights[k]).join("-");
}

function splitWeights<K extends string>(
  keys: readonly K[],
  raw: string,
): Record<K, number> | undefined {
  const parts = raw.split("-");
  if (parts.length !== keys.length || parts.some((p) => !/^\d{1,5}$/.test(p))) return undefined;
  return Object.fromEntries(keys.map((k, i) => [k, Number(parts[i])])) as Record<K, number>;
}

function toInt(raw: string): number | undefined {
  return /^\d{1,9}$/.test(raw) ? Number(raw) : undefined;
}

/** Serialises a config. Empty optional text fields are left out. */
export function encodeConfig(config: SimConfig): string {
  const params = new URLSearchParams();
  params.set("v", URL_STATE_VERSION);
  if (config.name) params.set(KEYS.name, config.name);
  if (config.ticker) params.set(KEYS.ticker, config.ticker);
  params.set(KEYS.projectType, config.projectType);
  params.set(KEYS.pairKind, config.pairKind);
  params.set(KEYS.pairSymbol, config.pairSymbol);
  params.set(KEYS.pairPriceEth, config.pairPriceEth);
  params.set(KEYS.taxBps, String(config.taxBps));
  params.set(KEYS.weights, joinWeights(ROUTE_IDS, config.weights));
  params.set(KEYS.openingBuyBps, String(config.openingBuyBps));
  params.set(KEYS.airdropBps, String(config.airdropBps));
  params.set(KEYS.audience, joinWeights(AUDIENCE_IDS, config.audience));
  if (config.creationFeeEth) params.set(KEYS.creationFeeEth, config.creationFeeEth);
  if (config.airdropFeeEth) params.set(KEYS.airdropFeeEth, config.airdropFeeEth);
  params.set(KEYS.tradeSize, config.tradeSize);
  params.set(KEYS.virtualTokensM, String(config.virtualTokensM));
  params.set(KEYS.scrubMs, String(config.scrubMs));
  return params.toString();
}

/**
 * Rebuilds a config from a query string. Each field is checked on its own and
 * falls back to the default if missing or malformed, so a damaged link still
 * loads. Cross-field problems (weights not totalling 100%, cap exceeded) are
 * kept as-is so the form can show the exact error.
 */
export function decodeConfig(params: Params): SimConfig {
  const config = defaultConfig();
  const shape = configFields.shape;

  function assign<F extends ConfigField>(field: F, candidate: unknown): void {
    if (candidate === undefined) return;
    const parsed = shape[field].safeParse(candidate);
    if (parsed.success) config[field] = parsed.data as SimConfig[F];
  }

  const text = (field: ConfigField) => read(params, KEYS[field]);
  const int = (field: ConfigField) => {
    const raw = text(field);
    return raw === undefined ? undefined : toInt(raw);
  };

  assign("name", text("name"));
  assign("ticker", text("ticker"));
  assign("projectType", text("projectType"));
  assign("pairKind", text("pairKind"));
  assign("pairSymbol", text("pairSymbol"));
  assign("pairPriceEth", text("pairPriceEth"));
  assign("taxBps", int("taxBps"));
  assign("openingBuyBps", int("openingBuyBps"));
  assign("airdropBps", int("airdropBps"));
  assign("creationFeeEth", text("creationFeeEth"));
  assign("airdropFeeEth", text("airdropFeeEth"));
  assign("tradeSize", text("tradeSize"));
  assign("virtualTokensM", int("virtualTokensM"));
  assign("scrubMs", int("scrubMs"));

  const weights = text("weights");
  if (weights !== undefined) assign("weights", splitWeights(ROUTE_IDS, weights));
  const audience = text("audience");
  if (audience !== undefined) assign("audience", splitWeights(AUDIENCE_IDS, audience));

  return config;
}

/** True when the params carry any simulator state at all. */
export function hasConfigParams(params: Params): boolean {
  return read(params, "v") !== undefined;
}
