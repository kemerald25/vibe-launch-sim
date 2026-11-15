import { ASSUMPTIONS } from "@/config/assumptions";
import { AUDIENCE_IDS, PROTOCOL } from "@/config/protocol";
import type { Simulation } from "@/lib/simulate";
import { formatBps, formatTokens } from "@/lib/units";
import { Panel } from "../ui";

const pct = (bps: number) => `${bps / 100}%`;

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
      style={{ background: color }}
    />
  );
}

export function SupplyMap({ sim }: { sim: Simulation }) {
  const s = sim.supply;
  const audiences = PROTOCOL.airdrop.audiences.value;
  const description = `Total supply ${formatTokens(s.totalSupply)} tokens: ${formatBps(s.curveBps)} bonding curve, ${formatBps(s.liquidityBps)} graduated liquidity. Your opening buy is ${formatBps(s.openingBuyBps)} and your airdrop reserve is ${formatBps(s.airdropBps)} of supply, ${formatBps(s.combinedBps)} combined against a ${formatBps(s.capBps)} limit.`;

  const legend = [
    { label: "Bonding curve", color: "var(--c-curve)", bps: s.curveBps, tokens: s.curveSupply },
    {
      label: "Graduated liquidity",
      color: "var(--c-liquidity)",
      bps: s.liquidityBps,
      tokens: s.liquiditySupply,
    },
    {
      label: "Your opening buy",
      color: "var(--accent)",
      bps: s.openingBuyBps,
      tokens: s.openingBuyTokens,
    },
    {
      label: "Your airdrop reserve",
      color: "var(--c-rewards-pair)",
      bps: s.airdropBps,
      tokens: s.airdropTokens,
    },
  ];

  return (
    <Panel
      id="supply"
      title="Supply map"
      intro={`All ${formatTokens(s.totalSupply)} tokens, and how much of that your opening buy and airdrop reserve take up.`}
    >
      <div role="img" aria-label={description} className="relative pt-6">
        <div
          className="absolute bottom-0 top-0 z-10 border-l-2 border-dashed border-text"
          style={{ left: pct(s.capBps) }}
        >
          <span className="absolute left-1.5 top-0 whitespace-nowrap font-mono text-[11px] leading-none text-text">
            {formatBps(s.capBps)} limit
          </span>
        </div>
        <div className="flex h-7 w-full overflow-hidden rounded-sm border border-line">
          <div style={{ width: pct(s.curveBps), background: "var(--c-curve)" }} />
          <div style={{ width: pct(s.liquidityBps), background: "var(--c-liquidity)" }} />
        </div>
        <div className="mt-1.5 flex h-7 w-full overflow-hidden rounded-sm border border-line bg-surface">
          <div
            style={{ width: pct(Math.min(s.openingBuyBps, 10000)), background: "var(--accent)" }}
          />
          <div
            style={{
              width: pct(Math.min(s.airdropBps, 10000 - Math.min(s.openingBuyBps, 10000))),
              background: "var(--c-rewards-pair)",
            }}
          />
        </div>
      </div>
      <div
        className="mt-1 flex justify-between font-mono text-[11px] text-muted"
        aria-hidden="true"
      >
        <span>0%</span>
        <span>100%</span>
      </div>

      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">Supply breakdown</caption>
        <thead>
          <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wider text-muted">
            <th scope="col" className="py-1.5 font-medium">
              Part
            </th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">
              Of supply
            </th>
            <th scope="col" className="py-1.5 text-right font-medium">
              Tokens
            </th>
          </tr>
        </thead>
        <tbody>
          {legend.map((row) => (
            <tr key={row.label} className="border-b border-line">
              <th scope="row" className="py-2 text-left font-normal text-body">
                <span className="flex items-center gap-2">
                  <Swatch color={row.color} />
                  {row.label}
                </span>
              </th>
              <td className="px-2 py-2 text-right font-mono text-muted">{formatBps(row.bps)}</td>
              <td className="py-2 text-right font-mono text-text">{formatTokens(row.tokens)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-sm text-body" data-testid="cap-readout">
        Opening buy plus airdrop reserve:{" "}
        <strong className={`font-mono font-medium ${s.withinCap ? "text-accent" : "text-danger"}`}>
          {formatBps(s.combinedBps)}
        </strong>{" "}
        of the {formatBps(s.capBps)} limit.{" "}
        {s.withinCap
          ? `${formatBps(s.headroomBps)} of supply is left under the limit.`
          : `That is ${formatBps(-s.headroomBps)} over the limit.`}
      </p>

      {sim.airdropByAudience ? (
        <dl className="mt-3 border-t border-line pt-2">
          {AUDIENCE_IDS.filter((id) => sim.config.audience[id] > 0).map((id) => (
            <div key={id} className="flex items-baseline justify-between gap-3 py-1 text-sm">
              <dt className="text-body">
                {audiences[id]}{" "}
                <span className="font-mono text-muted">{formatBps(sim.config.audience[id])}</span>
              </dt>
              <dd className="font-mono text-text">{formatTokens(sim.airdropByAudience![id])}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="mt-3 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-muted">
        {ASSUMPTIONS.airdropBucket.detail}
      </p>
    </Panel>
  );
}
