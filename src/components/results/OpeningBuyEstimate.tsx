import { ASSUMPTIONS } from "@/config/assumptions";
import { PROTOCOL } from "@/config/protocol";
import type { Simulation } from "@/lib/simulate";
import { formatAmount, formatBps, formatMultiple, formatTokens } from "@/lib/units";
import { NO_OPENING_BUY } from "@/lib/summary";
import { DataRow, EstimateBadge, EstimateNote, Panel } from "../ui";

export function OpeningBuyEstimate({ sim }: { sim: Simulation }) {
  const { curve, supply, pairSymbol, config, costs } = sim;
  const eth = PROTOCOL.network.currency.value;
  const isEth = config.pairKind === "eth";
  const hasBuy = supply.openingBuyTokens > 0n;
  const notEntered = <span className="text-muted">Not entered</span>;

  return (
    <Panel
      id="estimate"
      title="Estimated opening-buy cost"
      badge={<EstimateBadge />}
      intro="A model estimate of what your opening buy costs on the curve. The real curve formula is not published."
    >
      {hasBuy ? (
        <dl>
          <DataRow
            label={`Cost of ${formatTokens(supply.openingBuyTokens)} tokens, before tax`}
            value={
              <span data-testid="opening-cost">
                ≈ {formatAmount(curve.openingBuyCost)} {pairSymbol}
              </span>
            }
            sub={isEth ? undefined : `≈ ${formatAmount(curve.openingBuyCostEth)} ${eth}`}
            strong
          />
          <DataRow
            label={`Base tax on that amount (${formatBps(config.taxBps)})`}
            value={`≈ ${formatAmount(curve.openingBuyBaseTax)} ${pairSymbol}`}
          />
          <DataRow
            label="Model price after your buy"
            value={`${formatMultiple(curve.priceAfterOpeningBuyX100)} the starting price`}
          />
        </dl>
      ) : (
        <p className="text-sm text-body" data-testid="no-opening-buy">
          {NO_OPENING_BUY}
        </p>
      )}

      <h3 className="mt-5 text-[13px] uppercase tracking-wider text-muted">Launch costs</h3>
      <dl className="mt-1">
        <DataRow
          label="Creation fee"
          value={
            costs.creationFeeEth !== null
              ? `${formatAmount(costs.creationFeeEth)} ${eth}`
              : notEntered
          }
        />
        <DataRow
          label="Airdrop fee"
          value={
            costs.airdropFeeEth !== null ? (
              `${formatAmount(costs.airdropFeeEth)} ${eth}`
            ) : config.airdropBps > 0 ? (
              notEntered
            ) : (
              <span className="text-muted">No airdrop set</span>
            )
          }
        />
        <DataRow
          label="Opening purchase"
          value={
            hasBuy ? (
              `≈ ${formatAmount(curve.openingBuyCostEth)} ${eth}`
            ) : (
              <span className="text-muted">{NO_OPENING_BUY}</span>
            )
          }
        />
        <DataRow label="Network gas" value={<span className="text-muted">Not estimated</span>} />
        <DataRow
          label="Subtotal of the lines above"
          value={`≈ ${formatAmount(costs.knownTotalEth)} ${eth}`}
          sub={`Leaves out: ${costs.missing.join(", ")}`}
          strong
        />
      </dl>

      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Graduation target: fixed at creation in {pairSymbol} units, approximately{" "}
        {String(PROTOCOL.launch.graduationTargetApproxEth.value)} {eth} of value
        {isEth
          ? ""
          : ` (≈ ${formatAmount(curve.targetPair)} ${pairSymbol} at the value you entered)`}
        .
      </p>
      <EstimateNote>
        {ASSUMPTIONS.curveFormula.detail} {ASSUMPTIONS.openingBuyTax.detail}
      </EstimateNote>
    </Panel>
  );
}
