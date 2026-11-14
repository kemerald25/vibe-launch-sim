"use client";

import { PROTOCOL, ROUTE_IDS } from "@/config/protocol";
import { ROUTE_CSS_COLORS } from "@/config/site";
import type { Simulation } from "@/lib/simulate";
import { routeShareOfTaxBps } from "@/lib/tax";
import { formatAmount, formatBps } from "@/lib/units";
import { describedBy, Field, inputClass, Panel } from "../ui";

const { tax } = PROTOCOL;

export function TaxBreakdown({
  sim,
  tradeSize,
  tradeSizeError,
  onTradeSizeChange,
}: {
  sim: Simulation;
  tradeSize: string;
  tradeSizeError?: string;
  onTradeSizeChange: (value: string) => void;
}) {
  const { pairSymbol, config } = sim;
  const t = sim.tax;

  const rows = [
    {
      id: "protocol",
      label: "Protocol share",
      color: "var(--c-protocol)",
      shareBps: tax.protocolShareBps.value,
      amount: t.protocolShare,
    },
    ...ROUTE_IDS.map((id) => ({
      id,
      label: tax.routes.value[id].label,
      color: ROUTE_CSS_COLORS[id],
      shareBps: routeShareOfTaxBps(config.weights[id]),
      amount: t.routes[id],
    })),
  ];

  const barLabel = `Tax split: ${rows.map((r) => `${r.label} ${formatBps(r.shareBps)}`).join(", ")}.`;

  return (
    <Panel
      id="tax"
      title="Tax per trade"
      intro={`Every buy and sell pays the ${formatBps(config.taxBps)} base tax. The tax is then split ${formatBps(tax.projectShareBps.value)} project, ${formatBps(tax.protocolShareBps.value)} protocol. Those percentages divide the tax, not the trade.`}
    >
      <div className="max-w-xs">
        <Field id="tradeSize" label={`Trade size (${pairSymbol})`} error={tradeSizeError}>
          <input
            id="tradeSize"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={tradeSize}
            aria-invalid={tradeSizeError ? true : undefined}
            aria-describedby={describedBy("tradeSize", false, tradeSizeError)}
            onChange={(e) => onTradeSizeChange(e.target.value.trim())}
            className={inputClass}
          />
        </Field>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Total tax", value: t.totalTax, testId: "total-tax" },
          { label: "Protocol", value: t.protocolShare, testId: "protocol-share" },
          { label: "Project", value: t.projectShare, testId: "project-share" },
        ].map((item) => (
          <div key={item.label} className="rounded-md border border-line bg-surface px-2 py-2.5">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {item.label}
            </dt>
            <dd
              className="mt-0.5 break-all font-mono text-[15px] font-medium text-text"
              data-testid={item.testId}
            >
              {formatAmount(item.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div
        role="img"
        aria-label={barLabel}
        className="mt-4 flex h-7 w-full overflow-hidden rounded-sm border border-line"
      >
        {rows.map((row) =>
          row.shareBps > 0 ? (
            <div
              key={row.id}
              style={{ width: `${row.shareBps / 100}%`, background: row.color }}
              className="h-full border-r border-bg last:border-r-0"
            />
          ) : null,
        )}
      </div>

      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">
          Where the tax on a {formatAmount(t.tradeAmount)} {pairSymbol} trade goes
        </caption>
        <thead>
          <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wider text-muted">
            <th scope="col" className="py-1.5 pr-2 font-medium">
              Goes to
            </th>
            <th scope="col" className="px-2 py-1.5 text-right font-medium">
              Of tax
            </th>
            <th scope="col" className="py-1.5 pl-2 text-right font-medium">
              {pairSymbol}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line">
              <th scope="row" className="py-2 pr-2 text-left font-normal text-body">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ background: row.color }}
                  />
                  {row.label}
                </span>
              </th>
              <td className="px-2 py-2 text-right font-mono text-muted">
                {formatBps(row.shareBps)}
              </td>
              <td
                className="py-2 pl-2 text-right font-mono text-text"
                data-testid={`route-${row.id}`}
              >
                {formatAmount(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="py-2 pr-2 text-left font-mono font-medium text-text">
              Total tax
            </th>
            <td className="px-2 py-2 text-right font-mono text-muted">100%</td>
            <td className="py-2 pl-2 text-right font-mono font-medium text-accent">
              {formatAmount(t.totalTax)}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        After tax, {formatAmount(t.netAmount)} {pairSymbol} of the trade remains. Amounts are shown
        as value in {pairSymbol}; the token-reward and burn routes are delivered in the launched
        token.
      </p>
    </Panel>
  );
}
