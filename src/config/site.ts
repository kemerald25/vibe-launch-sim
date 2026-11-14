/**
 * Site identity. The product name is a placeholder: change `name` here and it
 * updates everywhere (UI, metadata, share card, OG image, summary text).
 */
export const SITE = {
  name: "Preflight",
  tagline: "Launch simulator for vibe/vibe builders",
  description:
    "See exactly what your vibe/vibe launch settings mean before you sign anything. Free, client-side, and never asks you to connect a wallet.",
  unofficialLabel: "Unofficial community tool. Not affiliated with or endorsed by vibe/vibe.",
  noWalletLabel: "Preflight never asks you to connect a wallet.",
  author: "Unity Ekeoba",
  // Placeholder links: replace with the real profiles.
  githubUrl: "https://github.com/kemerald25/vibe-launch-sim",
  authorGithubUrl: "https://github.com/kemerald25",
  authorXUrl: "https://x.com/your-handle",
} as const;

export const ISSUES_URL = `${SITE.githubUrl}/issues/new`;

/**
 * Fixed colours for surfaces that cannot read CSS variables (the PNG card and
 * the Open Graph image). Mirrors the dark theme in `globals.css`.
 */
export const CARD_COLORS = {
  bg: "#0e1010",
  surface: "#161917",
  text: "#f1f4eb",
  body: "#ced3c8",
  muted: "#a0a99b",
  line: "#30352e",
  accent: "#dff902",
  soft: "#262e13",
} as const;

/** Base URL for absolute links in metadata. Uses Vercel's built-in variables; no setup needed. */
export function siteUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}

/** Chart colours shared by the form, the tax bar, the PNG card and the OG image. */
export const ROUTE_CSS_COLORS = {
  treasury: "var(--c-treasury)",
  rewardsPair: "var(--c-rewards-pair)",
  rewardsToken: "var(--c-rewards-token)",
  burn: "var(--c-burn)",
} as const;

export const CARD_ROUTE_COLORS = {
  protocol: "#7b8376",
  treasury: "#dff902",
  rewardsPair: "#7fd1c0",
  rewardsToken: "#c9a6ff",
  burn: "#ff8f6b",
} as const;
