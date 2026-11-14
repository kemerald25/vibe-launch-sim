"use client";

import { ASSUMPTIONS } from "@/config/assumptions";
import { PROTOCOL } from "@/config/protocol";
import {
  ACTIVE_OPENING_TAX_MODEL,
  OPENING_WINDOW_MS,
  openingBuyOutcome,
  sampleOpeningTax,
} from "@/lib/openingTax";
import { BPS_DENOMINATOR, formatBps } from "@/lib/units";
import { EstimateBadge, EstimateNote, Panel } from "../ui";

const W = 320;
const H = 180;
const M = { left: 36, right: 10, top: 10, bottom: 24 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

const x = (ms: number) => M.left + (ms / OPENING_WINDOW_MS) * PLOT_W;
const y = (bps: number) => M.top + (1 - bps / BPS_DENOMINATOR) * PLOT_H;

const Y_TICKS = [0, 2500, 5000, 7500, 10000];
const X_TICKS = [0, 0.25, 0.5, 0.75, 1].map((f) => f * OPENING_WINDOW_MS);
const TABLE_TIMES = X_TICKS;

function seconds(ms: number): string {
  return String(ms / 1000);
}

export function OpeningTaxChart({
  taxBps,
  scrubMs,
  onScrub,
}: {
  taxBps: number;
  scrubMs: number;
  onScrub: (ms: number) => void;
}) {
  const windowSeconds = PROTOCOL.tax.openingWindowSeconds.value;
  const startRate = PROTOCOL.tax.openingStartRateBps.value;
  const samples = sampleOpeningTax(taxBps);
  const line = samples.map((s) => `${x(s.elapsedMs).toFixed(1)},${y(s.rateBps).toFixed(1)}`);
  const area = `M${x(0)},${y(0)} L${line.join(" L")} L${x(OPENING_WINDOW_MS)},${y(0)} Z`;
  const now = openingBuyOutcome(scrubMs, taxBps);
  // Single strings: SVG <title>/<desc> must not receive multiple text children.
  const chartTitle = `Buy tax during the first ${windowSeconds} seconds`;
  const chartDesc = `Buy tax starts at ${formatBps(startRate)} at launch and falls to ${formatBps(taxBps)} by second ${windowSeconds}, drawn with the ${ACTIVE_OPENING_TAX_MODEL.label.toLowerCase()} estimate. A table of values follows the chart.`;

  return (
    <Panel
      id="opening"
      title={`First ${windowSeconds} seconds`}
      badge={<EstimateBadge label="Shape is an estimate" />}
      intro={`For the first ${windowSeconds} seconds, buys on the curve pay an opening rate that falls from ${formatBps(startRate)} to your ${formatBps(taxBps)} base tax.`}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="opening-chart-title opening-chart-desc"
        className="block h-auto w-full max-w-xl"
      >
        <title id="opening-chart-title">{chartTitle}</title>
        <desc id="opening-chart-desc">{chartDesc}</desc>
        {Y_TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={M.left - 6}
              y={y(tick) + 3.5}
              textAnchor="end"
              fontSize="11"
              fill="var(--muted)"
              className="font-mono"
            >
              {tick / 100}%
            </text>
          </g>
        ))}
        {X_TICKS.map((tick) => (
          <text
            key={tick}
            x={x(tick)}
            y={H - 7}
            textAnchor="middle"
            fontSize="11"
            fill="var(--muted)"
            className="font-mono"
          >
            {seconds(tick)}s
          </text>
        ))}
        <path d={area} fill="var(--soft)" />
        <polyline
          points={line.join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1={x(scrubMs)}
          x2={x(scrubMs)}
          y1={M.top}
          y2={y(0)}
          stroke="var(--text)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle
          cx={x(scrubMs)}
          cy={y(now.rateBps)}
          r="4.5"
          fill="var(--bg)"
          stroke="var(--text)"
          strokeWidth="2"
        />
      </svg>

      <div className="mt-2 max-w-xl">
        <label htmlFor="scrub" className="font-mono text-[13px] font-medium text-text">
          Seconds after launch: {seconds(scrubMs)}
        </label>
        <input
          id="scrub"
          type="range"
          min={0}
          max={OPENING_WINDOW_MS}
          step={500}
          value={scrubMs}
          aria-valuetext={`Second ${seconds(scrubMs)}: ${formatBps(now.rateBps)} buy tax`}
          onChange={(e) => onScrub(Number(e.target.value))}
        />
      </div>

      <p
        className="mt-2 text-[15px] leading-relaxed text-text"
        aria-live="polite"
        data-testid="scrub-readout"
      >
        A buyer at second {seconds(scrubMs)} pays{" "}
        <strong className="font-mono font-medium text-accent">{formatBps(now.rateBps)}</strong> tax
        and receives{" "}
        <strong className="font-mono font-medium text-accent">{formatBps(now.receivedBps)}</strong>{" "}
        of their purchase.
      </p>

      <ul className="mt-3 space-y-1.5 text-sm text-body">
        <li>Sells are exempt from the opening surcharge. They pay the base tax only.</li>
        <li>
          The creator&apos;s opening buy, made in the launch transaction, is exempt from the
          surcharge.
        </li>
        <li>
          Everything above the base rate
          {now.surchargeBps > 0 ? ` (${formatBps(now.surchargeBps)} at this second)` : ""} goes to
          the protocol, not the project.
        </li>
      </ul>

      <details className="mt-3">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-mono text-[13px] text-muted underline decoration-line underline-offset-4">
          Show as a table
        </summary>
        <table className="mt-1 w-full max-w-md text-sm">
          <caption className="sr-only">Estimated buy tax by second</caption>
          <thead>
            <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wider text-muted">
              <th scope="col" className="py-1.5 font-medium">
                Second
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                Buy tax
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                Buyer receives
              </th>
            </tr>
          </thead>
          <tbody>
            {TABLE_TIMES.map((ms) => {
              const o = openingBuyOutcome(ms, taxBps);
              return (
                <tr key={ms} className="border-b border-line font-mono">
                  <th scope="row" className="py-1.5 text-left font-normal text-body">
                    {seconds(ms)}
                  </th>
                  <td className="py-1.5 text-right text-text">{formatBps(o.rateBps)}</td>
                  <td className="py-1.5 text-right text-text">{formatBps(o.receivedBps)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>

      <EstimateNote>{ASSUMPTIONS.openingTaxShape.detail}</EstimateNote>
    </Panel>
  );
}
