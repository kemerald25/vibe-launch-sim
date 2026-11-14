"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SITE } from "@/config/site";
import {
  defaultConfig,
  isValid,
  validateConfig,
  type ConfigErrors,
  type SimConfig,
} from "@/lib/schema";
import { simulate, type Simulation } from "@/lib/simulate";
import { encodeConfig } from "@/lib/urlState";
import { ConfigForm } from "./form/ConfigForm";
import { LockedList } from "./results/LockedList";
import { Notices } from "./results/Notices";
import { OpeningBuyEstimate } from "./results/OpeningBuyEstimate";
import { OpeningTaxChart } from "./results/OpeningTaxChart";
import { SupplyMap } from "./results/SupplyMap";
import { TaxBreakdown } from "./results/TaxBreakdown";
import { SharePanel } from "./share/SharePanel";

function ErrorSummary({ errors }: { errors: ConfigErrors }) {
  const messages = Object.values(errors);
  return (
    <div
      role="alert"
      className="rounded-md border border-danger bg-panel p-4"
      data-testid="error-summary"
    >
      <p className="font-mono text-sm font-medium text-text">
        {messages.length === 1
          ? "One setting needs fixing"
          : `${messages.length} settings need fixing`}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-body">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] text-muted">
        The results below show your last valid settings until this is fixed.
      </p>
    </div>
  );
}

export function Simulator({
  initialConfig,
  syncUrlOnLoad,
}: {
  initialConfig: SimConfig;
  /** True when the page was opened from a shared link, so the URL already carries state. */
  syncUrlOnLoad: boolean;
}) {
  const [config, setConfig] = useState(initialConfig);
  const errors = useMemo(() => validateConfig(config), [config]);
  const valid = isValid(errors);
  const current = useMemo<Simulation | null>(
    () => (valid ? simulate(config) : null),
    [config, valid],
  );

  // Keep showing the last valid results while the user is mid-edit.
  const [lastValid, setLastValid] = useState<Simulation | null>(current);
  if (current && current !== lastValid) setLastValid(current);
  const sim = current ?? lastValid;

  const update = useCallback(<K extends keyof SimConfig>(key: K, value: SimConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
  }, []);
  const patch = useCallback((partial: Partial<SimConfig>) => {
    setConfig((c) => ({ ...c, ...partial }));
  }, []);

  // Mirror state into the query string so the address bar is always shareable.
  // A clean visit to "/" keeps its clean URL until the first edit.
  const touched = useRef(syncUrlOnLoad);
  useEffect(() => {
    if (!touched.current && config === initialConfig) return;
    touched.current = true;
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, "", `${window.location.pathname}?${encodeConfig(config)}`);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [config, initialConfig]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <div className="lg:sticky lg:top-12 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto">
        <a
          href="#results"
          className="mb-3 inline-flex min-h-11 items-center font-mono text-[13px] text-muted underline decoration-line underline-offset-4 hover:text-text lg:hidden"
        >
          Jump to results
        </a>
        <ConfigForm
          config={config}
          errors={errors}
          update={update}
          patch={patch}
          onReset={() => setConfig(defaultConfig())}
        />
      </div>

      <div id="results" className="scroll-mt-14 space-y-5">
        <h2 className="sr-only">What these settings mean</h2>
        {valid ? null : <ErrorSummary errors={errors} />}
        {sim ? (
          <>
            <TaxBreakdown
              sim={sim}
              tradeSize={config.tradeSize}
              tradeSizeError={errors.tradeSize}
              onTradeSizeChange={(value) => update("tradeSize", value)}
            />
            <OpeningTaxChart
              taxBps={sim.config.taxBps}
              scrubMs={config.scrubMs}
              onScrub={(ms) => update("scrubMs", ms)}
            />
            <SupplyMap sim={sim} />
            <OpeningBuyEstimate sim={sim} />
            <LockedList sim={sim} />
            <Notices config={sim.config} />
            <SharePanel sim={sim} disabled={!valid} />
          </>
        ) : (
          <p className="rounded-md border border-line bg-panel p-4 text-sm text-body">
            This link has settings that do not add up. Fix the highlighted fields and the results
            will appear here. {SITE.noWalletLabel}
          </p>
        )}
      </div>
    </div>
  );
}
