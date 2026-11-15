"use client";

import { ASSUMPTIONS, FORM_LIMITS } from "@/config/assumptions";
import {
  AUDIENCE_IDS,
  PAIR_KIND_IDS,
  PROJECT_TYPE_IDS,
  PROTOCOL,
  ROUTE_IDS,
  type PairKindId,
} from "@/config/protocol";
import { ROUTE_CSS_COLORS } from "@/config/site";
import { ACTIVE_CURVE_MODEL, curveParams, minVirtualTokensM } from "@/lib/curve";
import type { ConfigErrors, SimConfig } from "@/lib/schema";
import { formatBps, formatMultiple, ONE } from "@/lib/units";
import { describedBy, EstimateBadge, Field, FieldError, inputClass } from "../ui";
import { PercentField, Segmented, WeightSliders } from "./controls";

type Update = <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => void;

const { launch, tax, airdrop, network } = PROTOCOL;

const routeLabels = Object.fromEntries(
  ROUTE_IDS.map((id) => [id, tax.routes.value[id].label]),
) as Record<(typeof ROUTE_IDS)[number], string>;

const taxOptions = tax.baseOptionsBps.value.map((bps) => ({ value: bps, label: formatBps(bps) }));

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-4 w-full text-[13px] uppercase tracking-wider text-muted">
        {legend}
      </legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

export function ConfigForm({
  config,
  errors,
  update,
  patch,
  onReset,
}: {
  config: SimConfig;
  errors: ConfigErrors;
  update: Update;
  patch: (partial: Partial<SimConfig>) => void;
  onReset: () => void;
}) {
  const isEth = config.pairKind === "eth";
  const cap = launch.maxCreatorAllocationBps.value;

  function changePairKind(kind: PairKindId) {
    if (kind === "eth") {
      patch({ pairKind: kind, pairSymbol: network.currency.value, pairPriceEth: "1" });
    } else if (config.pairKind === "eth") {
      patch({ pairKind: kind, pairSymbol: "" });
    } else {
      patch({ pairKind: kind });
    }
  }

  const vtValid = !errors.virtualTokensM;
  const graduationMultiple = vtValid
    ? ACTIVE_CURVE_MODEL.priceMultipleX100(
        launch.curveSupply.value,
        curveParams(ONE, config.virtualTokensM),
      )
    : null;

  return (
    <form
      aria-label="Launch settings"
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="space-y-5 rounded-md border border-line bg-panel p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base">Your launch settings</h2>
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 px-1 font-mono text-[13px] text-muted underline decoration-line underline-offset-4 hover:text-text"
        >
          Reset
        </button>
      </div>

      <Group legend="Token">
        <div className="grid grid-cols-[1fr_7.5rem] gap-3">
          <Field id="name" label="Name" error={errors.name}>
            <input
              id="name"
              type="text"
              autoComplete="off"
              maxLength={FORM_LIMITS.nameMaxLength + 8}
              placeholder="Untitled token"
              value={config.name}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy("name", false, errors.name)}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id="ticker" label="Ticker" error={errors.ticker}>
            <input
              id="ticker"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="TICK"
              value={config.ticker}
              aria-invalid={errors.ticker ? true : undefined}
              aria-describedby={describedBy("ticker", false, errors.ticker)}
              onChange={(e) => update("ticker", e.target.value.toUpperCase())}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="-mt-2 text-[13px] text-muted">
          Name and ticker are cosmetic here. They only label your summary.
        </p>
        <Field id="projectType" label="Project type (optional)">
          <select
            id="projectType"
            value={config.projectType}
            onChange={(e) => update("projectType", e.target.value as SimConfig["projectType"])}
            className={inputClass}
          >
            <option value="none">Not set</option>
            {PROJECT_TYPE_IDS.map((id) => (
              <option key={id} value={id}>
                {launch.projectTypes.value[id]}
              </option>
            ))}
          </select>
        </Field>
      </Group>

      <Group legend="Pair asset">
        <Field
          id="pairKind"
          label="Pair against"
          hint="Available pairs vary and are shown in the vibe/vibe app when you create."
        >
          <select
            id="pairKind"
            value={config.pairKind}
            aria-describedby="pairKind-hint"
            onChange={(e) => changePairKind(e.target.value as PairKindId)}
            className={inputClass}
          >
            {PAIR_KIND_IDS.map((id) => (
              <option key={id} value={id}>
                {launch.pairKinds.value[id]}
              </option>
            ))}
          </select>
        </Field>
        {isEth ? null : (
          <div className="grid grid-cols-2 gap-3">
            <Field id="pairSymbol" label="Pair symbol" error={errors.pairSymbol}>
              <input
                id="pairSymbol"
                type="text"
                autoComplete="off"
                placeholder="SYMBOL"
                value={config.pairSymbol}
                aria-invalid={errors.pairSymbol ? true : undefined}
                aria-describedby={describedBy("pairSymbol", false, errors.pairSymbol)}
                onChange={(e) => update("pairSymbol", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              id="pairPriceEth"
              label="Value in ETH"
              badge={<EstimateBadge label="You enter" />}
              error={errors.pairPriceEth}
            >
              <input
                id="pairPriceEth"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={config.pairPriceEth}
                aria-invalid={errors.pairPriceEth ? true : undefined}
                aria-describedby={describedBy("pairPriceEth", false, errors.pairPriceEth)}
                onChange={(e) => update("pairPriceEth", e.target.value.trim())}
                className={inputClass}
              />
            </Field>
            <p className="col-span-2 -mt-1 text-[13px] text-muted">
              {ASSUMPTIONS.pairPrice.detail}
            </p>
          </div>
        )}
      </Group>

      <Group legend="Tax">
        <div>
          <Segmented
            name="taxBps"
            legend="Base project tax, on buys and sells"
            options={taxOptions}
            value={config.taxBps}
            onChange={(value) => update("taxBps", value)}
          />
          <FieldError id="taxBps-error" message={errors.taxBps} />
        </div>
        <WeightSliders
          idPrefix="weights"
          legend="Where the project share goes"
          hint={`You route the project's ${formatBps(tax.projectShareBps.value)} of the tax. Sliders always total 100%.`}
          keys={ROUTE_IDS}
          labels={routeLabels}
          colors={ROUTE_CSS_COLORS}
          weights={config.weights}
          onChange={(weights) => update("weights", weights)}
          error={errors.weights}
        />
      </Group>

      <Group legend="Supply">
        <PercentField
          id="openingBuy"
          label="Opening buy"
          valueBps={config.openingBuyBps}
          maxBps={cap}
          invalid={Boolean(errors.allocation || errors.openingBuyBps)}
          onChange={(bps) => update("openingBuyBps", bps)}
          hint="Share of total supply the creator buys in the launch transaction."
        />
        <PercentField
          id="airdrop"
          label="Airdrop reserve"
          valueBps={config.airdropBps}
          maxBps={cap}
          invalid={Boolean(errors.allocation || errors.airdropBps)}
          onChange={(bps) => update("airdropBps", bps)}
          hint="Share of total supply reserved for a graduation airdrop."
        />
        <FieldError id="allocation-error" message={errors.allocation} />
        {config.airdropBps > 0 ? (
          <WeightSliders
            idPrefix="audience"
            legend="Airdrop audiences"
            hint="How the reserve is split across the four audiences."
            keys={AUDIENCE_IDS}
            labels={airdrop.audiences.value}
            weights={config.audience}
            onChange={(audience) => update("audience", audience)}
            error={errors.audience}
          />
        ) : null}
      </Group>

      <Group legend="Fees from the app (optional)">
        <p className="text-[13px] text-muted">{ASSUMPTIONS.fees.detail}</p>
        <div className="grid gap-3 min-[420px]:grid-cols-2">
          <Field
            id="creationFeeEth"
            label="Creation fee"
            badge={<EstimateBadge label="You enter" />}
            error={errors.creationFeeEth}
          >
            <input
              id="creationFeeEth"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="ETH"
              value={config.creationFeeEth}
              aria-invalid={errors.creationFeeEth ? true : undefined}
              aria-describedby={describedBy("creationFeeEth", false, errors.creationFeeEth)}
              onChange={(e) => update("creationFeeEth", e.target.value.trim())}
              className={inputClass}
            />
          </Field>
          <Field
            id="airdropFeeEth"
            label="Airdrop fee"
            badge={<EstimateBadge label="You enter" />}
            error={errors.airdropFeeEth}
          >
            <input
              id="airdropFeeEth"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="ETH"
              value={config.airdropFeeEth}
              aria-invalid={errors.airdropFeeEth ? true : undefined}
              aria-describedby={describedBy("airdropFeeEth", false, errors.airdropFeeEth)}
              onChange={(e) => update("airdropFeeEth", e.target.value.trim())}
              className={inputClass}
            />
          </Field>
        </div>
      </Group>

      <details className="border-t border-line pt-4">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 font-mono text-[13px] uppercase tracking-wider text-muted">
          Advanced assumptions
          <EstimateBadge />
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-[13px] text-muted">
            {ASSUMPTIONS.curveFormula.detail} {ASSUMPTIONS.virtualTokenReserve.detail}
          </p>
          <Field
            id="virtualTokensM"
            label="Virtual token reserve (millions)"
            error={errors.virtualTokensM}
            hint={
              graduationMultiple !== null
                ? `With this value the model's price at graduation is ${formatMultiple(graduationMultiple)} its starting price. Higher values make the curve flatter.`
                : undefined
            }
          >
            <input
              id="virtualTokensM"
              type="number"
              inputMode="numeric"
              min={minVirtualTokensM()}
              max={FORM_LIMITS.virtualTokensMaxM}
              step={1}
              value={config.virtualTokensM}
              aria-invalid={errors.virtualTokensM ? true : undefined}
              aria-describedby={describedBy(
                "virtualTokensM",
                graduationMultiple !== null,
                errors.virtualTokensM,
              )}
              onChange={(e) => {
                if (e.target.value === "") return;
                const n = Number(e.target.value);
                if (Number.isFinite(n)) update("virtualTokensM", n);
              }}
              className={inputClass}
            />
          </Field>
        </div>
      </details>
    </form>
  );
}
