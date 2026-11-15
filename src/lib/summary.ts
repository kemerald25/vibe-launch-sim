import { AUDIENCE_IDS, PROTOCOL, ROUTE_IDS, VERIFIED_ON } from "@/config/protocol";
import { SITE } from "@/config/site";
import type { SimConfig } from "./schema";
import type { Simulation } from "./simulate";
import { formatAmount, formatBps, formatTokens } from "./units";

export function displayName(config: SimConfig): string {
  const name = config.name.trim();
  const ticker = config.ticker.trim().toUpperCase();
  if (name && ticker) return `${name} ($${ticker})`;
  if (name) return name;
  if (ticker) return `$${ticker}`;
  return "Untitled token";
}

export function lockedSettingsLine(): string {
  return "pair asset, tax, routing weights, graduation target, holder books, airdrop campaign";
}

/** Discord-flavoured markdown summary of a simulation. */
export function buildSummary(sim: Simulation, url: string): string {
  const { config, pairSymbol, tax, supply, curve } = sim;
  const routes = PROTOCOL.tax.routes.value;
  const audiences = PROTOCOL.airdrop.audiences.value;
  const windowSeconds = PROTOCOL.tax.openingWindowSeconds.value;

  const routing = ROUTE_IDS.filter((id) => config.weights[id] > 0)
    .map((id) => `${routes[id].short} ${formatBps(config.weights[id])}`)
    .join(" · ");

  const lines: string[] = [
    `**${SITE.name} simulation: ${displayName(config)}**`,
    `> ${SITE.unofficialLabel}`,
    "",
    "**Setup**",
    `- Pair asset: ${pairSymbol}`,
    `- Base tax: ${formatBps(config.taxBps)} on buys and sells`,
    `- Project share routing: ${routing}`,
    "",
    `**Tax on a ${formatAmount(tax.tradeAmount)} ${pairSymbol} trade**`,
    `- Total tax: ${formatAmount(tax.totalTax)} ${pairSymbol}`,
    `- Protocol share (${formatBps(PROTOCOL.tax.protocolShareBps.value)} of tax): ${formatAmount(tax.protocolShare)} ${pairSymbol}`,
    `- Project share (${formatBps(PROTOCOL.tax.projectShareBps.value)} of tax): ${formatAmount(tax.projectShare)} ${pairSymbol}`,
    "",
    "**Supply**",
    `- Opening buy: ${formatBps(supply.openingBuyBps)} (${formatTokens(supply.openingBuyTokens)} tokens)`,
    `- Airdrop reserve: ${formatBps(supply.airdropBps)} (${formatTokens(supply.airdropTokens)} tokens)`,
    `- Combined: ${formatBps(supply.combinedBps)} of the ${formatBps(supply.capBps)} limit`,
  ];

  if (config.airdropBps > 0) {
    const split = AUDIENCE_IDS.filter((id) => config.audience[id] > 0)
      .map((id) => `${audiences[id]} ${formatBps(config.audience[id])}`)
      .join(" · ");
    lines.push(`- Airdrop audiences: ${split}`);
  }

  lines.push(
    "",
    `**First ${windowSeconds} seconds**`,
    `- Curve buys pay an opening rate that falls from ${formatBps(PROTOCOL.tax.openingStartRateBps.value)} to ${formatBps(config.taxBps)}. Sells and the creator's opening buy are exempt from the surcharge.`,
    "",
    "**Estimates (model, not protocol data)**",
    `- Opening buy cost: about ${formatAmount(curve.openingBuyCost)} ${pairSymbol} before tax`,
    `- Graduation target: about ${formatAmount(curve.targetPair)} ${pairSymbol}`,
    "",
    `**Locked after launch:** ${lockedSettingsLine()}`,
    "",
    url,
    `Rules last checked ${VERIFIED_ON}. Trust the app's review screen over this tool.`,
  );

  return lines.join("\n");
}
