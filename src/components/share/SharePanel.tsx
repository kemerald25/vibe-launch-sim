"use client";

import { useState } from "react";
import { SITE } from "@/config/site";
import { buildCardData } from "@/lib/cardData";
import type { Simulation } from "@/lib/simulate";
import { buildSummary } from "@/lib/summary";
import { encodeConfig } from "@/lib/urlState";
import { buttonClass, Panel, primaryButtonClass } from "../ui";
import { canvasToBlob, drawCard } from "./card";

function shareUrl(sim: Simulation): string {
  return `${window.location.origin}${window.location.pathname}?${encodeConfig(sim.config)}`;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for browsers or in-app webviews without the async clipboard API.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Copy was blocked by the browser.");
}

export function SharePanel({ sim, disabled }: { sim: Simulation; disabled: boolean }) {
  const [status, setStatus] = useState("");

  async function run(action: () => Promise<string>) {
    try {
      setStatus(await action());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  const copyLink = () =>
    run(async () => {
      await copyText(shareUrl(sim));
      return "Link copied. Anyone who opens it sees this exact simulation.";
    });

  const copySummary = () =>
    run(async () => {
      await copyText(buildSummary(sim, shareUrl(sim)));
      return "Summary copied. Paste it into Discord.";
    });

  const downloadCard = () =>
    run(async () => {
      await document.fonts.ready;
      const style = getComputedStyle(document.documentElement);
      const canvas = document.createElement("canvas");
      drawCard(canvas, buildCardData(sim), {
        mono: `${style.getPropertyValue("--font-jetbrains") || "monospace"}, monospace`,
        sans: `${style.getPropertyValue("--font-instrument") || "sans-serif"}, sans-serif`,
      });
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = (sim.config.ticker || sim.config.name || "simulation")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.href = url;
      link.download = `${SITE.name.toLowerCase()}-${slug || "simulation"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return "Card downloaded as a PNG.";
    });

  return (
    <Panel
      id="share"
      title="Share this simulation"
      intro="The link holds every setting. Nothing is stored anywhere else."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" className={primaryButtonClass} onClick={copyLink} disabled={disabled}>
          Copy link
        </button>
        <button type="button" className={buttonClass} onClick={copySummary} disabled={disabled}>
          Copy summary
        </button>
        <button type="button" className={buttonClass} onClick={downloadCard} disabled={disabled}>
          Download card
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-5 text-[13px] text-muted"
        data-testid="share-status"
      >
        {disabled ? "Fix the highlighted settings to share." : status}
      </p>
    </Panel>
  );
}
