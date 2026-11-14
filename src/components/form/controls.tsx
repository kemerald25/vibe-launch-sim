"use client";

import { formatBps } from "@/lib/units";
import { rebalanceWeights, weightsTotal } from "@/lib/weights";
import { FieldError } from "../ui";

/** Radio group styled as a segmented control. */
export function Segmented<T extends string | number>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px]">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col overflow-hidden rounded-md border border-line">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={String(option.value)}
              className={`flex min-h-11 cursor-pointer items-center justify-center border-r border-line font-mono text-sm font-medium last:border-r-0 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent ${
                checked ? "bg-accent text-accent-ink" : "bg-surface text-body hover:text-text"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A group of sliders that always totals 100%. Moving one rebalances the others. */
export function WeightSliders<K extends string>({
  idPrefix,
  legend,
  keys,
  labels,
  colors,
  weights,
  onChange,
  error,
  hint,
}: {
  idPrefix: string;
  legend: string;
  keys: readonly K[];
  labels: Record<K, string>;
  colors?: Record<K, string>;
  weights: Record<K, number>;
  onChange: (weights: Record<K, number>) => void;
  error?: string;
  hint?: string;
}) {
  const total = weightsTotal(weights);
  return (
    <fieldset aria-describedby={error ? `${idPrefix}-error` : undefined}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <legend className="float-left text-[13px]">{legend}</legend>
        <span
          className={`font-mono text-xs ${error ? "text-danger" : "text-muted"}`}
          data-testid={`${idPrefix}-total`}
        >
          Total {formatBps(total)}
        </span>
      </div>
      {hint ? <p className="mb-2 clear-both text-[13px] leading-snug text-muted">{hint}</p> : null}
      <div className="clear-both space-y-1.5">
        {keys.map((key) => {
          const id = `${idPrefix}-${key}`;
          return (
            <div key={key}>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={id} className="flex items-center gap-2 text-sm text-body">
                  {colors ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-[2px]"
                      style={{ background: colors[key] }}
                    />
                  ) : null}
                  {labels[key]}
                </label>
                <output htmlFor={id} className="font-mono text-sm text-text">
                  {formatBps(weights[key])}
                </output>
              </div>
              <input
                id={id}
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(weights[key] / 100)}
                aria-valuetext={`${formatBps(weights[key])} to ${labels[key]}`}
                onChange={(e) =>
                  onChange(rebalanceWeights(weights, keys, key, Number(e.target.value) * 100))
                }
              />
            </div>
          );
        })}
      </div>
      <FieldError id={`${idPrefix}-error`} message={error} />
    </fieldset>
  );
}

/** Slider plus number box for a share of supply held in basis points. */
export function PercentField({
  id,
  label,
  valueBps,
  maxBps,
  onChange,
  hint,
  invalid,
}: {
  id: string;
  label: string;
  valueBps: number;
  maxBps: number;
  onChange: (bps: number) => void;
  hint?: string;
  invalid?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-mono text-[13px] font-medium text-text">
          {label}
        </label>
        <span className="flex items-center gap-1.5">
          <input
            id={`${id}-number`}
            type="number"
            inputMode="decimal"
            min={0}
            max={maxBps / 100}
            step={0.1}
            value={valueBps / 100}
            aria-label={`${label}, percent of supply`}
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              if (e.target.value === "") return;
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0) onChange(Math.min(10_000, Math.round(n * 100)));
            }}
            className="min-h-11 w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-right font-mono text-sm text-text aria-[invalid=true]:border-danger"
          />
          <span aria-hidden="true" className="font-mono text-sm text-muted">
            %
          </span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={maxBps}
        step={50}
        value={Math.min(valueBps, maxBps)}
        aria-valuetext={`${formatBps(valueBps)} of supply`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <p className="text-[13px] leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}
