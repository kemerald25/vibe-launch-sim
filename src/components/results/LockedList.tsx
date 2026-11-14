import {
  AUDIENCE_IDS,
  LOCKED_SETTING_IDS,
  PROTOCOL,
  ROUTE_IDS,
  type LockedSettingId,
} from "@/config/protocol";
import type { Simulation } from "@/lib/simulate";
import { formatAmount, formatBps } from "@/lib/units";
import { Panel } from "../ui";

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="mt-0.5 shrink-0 text-accent"
    >
      <rect
        x="2.75"
        y="7"
        width="10.5"
        height="7"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function lockedItems(
  sim: Simulation,
): Record<LockedSettingId, { label: string; value: string }> {
  const { config, pairSymbol, curve } = sim;
  const routes = PROTOCOL.tax.routes.value;
  const audiences = PROTOCOL.airdrop.audiences.value;
  const eth = PROTOCOL.network.currency.value;
  const targetEth = String(PROTOCOL.launch.graduationTargetApproxEth.value);

  return {
    pair: {
      label: "Pair asset",
      value: `${pairSymbol} (${PROTOCOL.launch.pairKinds.value[config.pairKind]})`,
    },
    tax: {
      label: "Base tax",
      value: `${formatBps(config.taxBps)} on every buy and sell`,
    },
    weights: {
      label: "Tax routing weights",
      value: ROUTE_IDS.map((id) => `${routes[id].short} ${formatBps(config.weights[id])}`).join(
        " · ",
      ),
    },
    target: {
      label: "Graduation target",
      value:
        config.pairKind === "eth"
          ? `Approximately ${targetEth} ${eth} of value`
          : `Approximately ${targetEth} ${eth} of value, fixed in ${pairSymbol} units (≈ ${formatAmount(curve.targetPair)} ${pairSymbol} at the value you entered)`,
    },
    holderBooks: {
      label: "Holder books",
      value: "Fixed at creation. See the official docs for details.",
    },
    airdrop: {
      label: "Airdrop campaign",
      value:
        config.airdropBps > 0
          ? `${formatBps(config.airdropBps)} of supply · ${AUDIENCE_IDS.filter(
              (id) => config.audience[id] > 0,
            )
              .map((id) => `${audiences[id]} ${formatBps(config.audience[id])}`)
              .join(" · ")} · plus the recipient shortlist you pick in the app`
          : "No airdrop reserve. One cannot be added after launch.",
    },
  };
}

export function LockedList({ sim }: { sim: Simulation }) {
  const items = lockedItems(sim);
  return (
    <Panel
      id="locked"
      title="Locked forever"
      intro="These are fixed when you create the token. None of them can be edited later."
    >
      <ul className="divide-y divide-line">
        {LOCKED_SETTING_IDS.map((id) => (
          <li key={id} className="flex gap-3 py-2.5">
            <LockIcon />
            <div className="min-w-0">
              <p className="font-mono text-[13px] font-medium text-text">{items[id].label}</p>
              <p className="text-sm text-body" data-testid={`locked-${id}`}>
                {items[id].value}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
