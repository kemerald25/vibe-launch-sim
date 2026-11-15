import { PROTOCOL, ROUTE_IDS, VERIFIED_ON, type RouteId } from "@/config/protocol";
import { SITE } from "@/config/site";
import type { Simulation } from "./simulate";
import { displayName } from "./summary";
import { routeShareOfTaxBps } from "./tax";
import { formatAmount, formatBps } from "./units";

export interface CardStat {
  label: string;
  value: string;
  estimate?: boolean;
}

export interface CardSegment {
  id: RouteId | "protocol";
  label: string;
  /** Share of the whole tax, in bps. */
  bps: number;
}

export interface CardData {
  siteName: string;
  title: string;
  subtitle: string;
  stats: CardStat[];
  segmentsTitle: string;
  segments: CardSegment[];
  unofficialLabel: string;
  checkedLabel: string;
}

/** Everything the PNG card and the Open Graph image show. Shared so they never disagree. */
export function buildCardData(sim: Simulation): CardData {
  const { config, pairSymbol, supply, curve } = sim;
  const routes = PROTOCOL.tax.routes.value;
  const type =
    config.projectType === "none" ? null : PROTOCOL.launch.projectTypes.value[config.projectType];

  return {
    siteName: SITE.name,
    title: displayName(config),
    subtitle: [`Paired with ${pairSymbol}`, type, PROTOCOL.network.name.value]
      .filter(Boolean)
      .join("  ·  "),
    stats: [
      { label: "Base tax", value: formatBps(config.taxBps) },
      { label: "Opening buy", value: formatBps(supply.openingBuyBps) },
      { label: "Airdrop reserve", value: formatBps(supply.airdropBps) },
      supply.openingBuyTokens > 0n
        ? {
            label: "Opening-buy cost",
            value: `≈ ${formatAmount(curve.openingBuyCost)} ${pairSymbol}`,
            estimate: true,
          }
        : { label: "Opening-buy cost", value: "None set" },
    ],
    segmentsTitle: "Where the tax goes",
    segments: [
      { id: "protocol" as const, label: "Protocol", bps: PROTOCOL.tax.protocolShareBps.value },
      ...ROUTE_IDS.map((id) => ({
        id,
        label: routes[id].short,
        bps: routeShareOfTaxBps(config.weights[id]),
      })),
    ].filter((s) => s.bps > 0),
    unofficialLabel: SITE.unofficialLabel,
    checkedLabel: `Rules last checked ${VERIFIED_ON}`,
  };
}
