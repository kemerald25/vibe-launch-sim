# Preflight

**An unofficial launch simulator for vibe/vibe builders.**

> **Unofficial community tool. Not affiliated with or endorsed by vibe/vibe.**
> Preflight does not use vibe/vibe's logo, wordmark, or artwork, and nothing in it speaks for the vibe/vibe team.

On the vibe/vibe launchpad (Robinhood Chain Testnet), a creator picks a pair asset, a project tax, tax-routing weights, an opening buy, and a graduation-airdrop allocation. None of it can be changed after launch. Preflight lets a builder enter those settings and see, in plain language, what they mean before signing anything.

- **No wallet connection.** Preflight never asks you to connect a wallet. It cannot send transactions.
- **No backend, no database, no accounts, no tracking.** It is a client-side calculator. Your settings live only in the link you share.
- **No financial advice.** It describes mechanics. It never says a configuration is good, safe, or profitable.
- **No invented facts.** Every protocol number comes from one file of verified facts. Anything the docs do not state is an editable assumption with an "estimate" badge.

"Preflight" is a placeholder name. Change `name` in [`src/config/site.ts`](src/config/site.ts) and it updates everywhere.

## What it shows

- **Tax per trade**: total tax, protocol share, project share, and the amount to each of the four routes.
- **First 20 seconds**: a chart of the opening buy tax with a scrubber.
- **Supply map**: the 1B supply, your opening buy and airdrop reserve, and the 50% limit.
- **Estimated opening-buy cost**: from a curve model, badged as an estimate.
- **Locked forever**: every setting that cannot be changed after launch, filled in with your choices.
- **Things to know**: factual notices triggered by your settings.
- **Sharing**: the whole configuration lives in the URL; copy a Discord-ready summary; download a PNG card; each shared link gets its own Open Graph image.

Pages: `/` simulator, `/learn` plain-language explainer, `/about` sources and how to report a wrong number.

## Local setup

Requires Node.js 20.9 or newer and pnpm.

```bash
corepack enable pnpm
```

```bash
pnpm install
```

```bash
pnpm dev
```

Open http://localhost:3000.

If `corepack enable` needs administrator rights on your machine, prefix commands with corepack instead, for example `corepack pnpm install`.

### Scripts

| Command          | What it does                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `pnpm dev`       | Start the dev server                                                   |
| `pnpm build`     | Production build                                                       |
| `pnpm start`     | Serve the production build                                             |
| `pnpm lint`      | ESLint, zero warnings allowed                                          |
| `pnpm typecheck` | TypeScript in strict mode                                              |
| `pnpm test`      | Vitest unit tests                                                      |
| `pnpm test:e2e`  | Playwright tests against the production build (run `pnpm build` first) |
| `pnpm format`    | Prettier                                                               |

First-time Playwright setup: `pnpm exec playwright install chromium`.

## Project structure

```
src/app/            routes, layout, OG image route (/og)
src/components/     form, results, charts, share
src/config/         protocol.ts (verified facts), assumptions.ts (estimates),
                    notices.ts (rules), site.ts (name, links)
src/lib/            tax.ts, openingTax.ts, curve.ts, supply.ts, weights.ts,
                    schema.ts, simulate.ts, urlState.ts, summary.ts, units.ts
src/lib/__tests__/  unit tests
e2e/                Playwright tests
```

All maths lives in pure functions in `src/lib` with no React imports. Pair-asset amounts are `bigint` with 18 decimals, token amounts are `bigint` whole tokens, and percentages are integer basis points, so there is no floating-point drift.

## Updating the protocol config when testnet rules change

Every protocol fact lives in [`src/config/protocol.ts`](src/config/protocol.ts), each with a `value`, a `source` (docs section), and a `verifiedOn` date. No protocol number is hard-coded anywhere else.

1. Read the changed rule in the [official docs](https://testnet.vibevibe.fun/docs/).
2. Update the `value` and `source` in `src/config/protocol.ts`.
3. Set `VERIFIED_ON` at the top of that file to today's date. The UI's "Rules last checked" date reads from it.
4. Run `pnpm test`. Tests that pin documented values (for example the $1,000 worked example, or the 50% limit) will fail if the rule changed. Update them to the new documented values.
5. If the change adds or removes a rule that affects users, update `src/config/notices.ts` and the `/learn` page.
6. Run `pnpm lint && pnpm typecheck && pnpm build`.

If something moves from "unverified" to "documented", move it from `src/config/assumptions.ts` into `protocol.ts` and remove its estimate badge.

## Unverified assumptions

These are not in the docs. Each is a named assumption in [`src/config/assumptions.ts`](src/config/assumptions.ts), shown with an "estimate" badge and a note to trust the app's review screen over this tool.

| Assumption                     | What Preflight does                                                                                                                                                                      | Where to change it                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Shape of the opening-tax decay | Straight line from 99% to the base tax over 20 seconds                                                                                                                                   | `src/lib/openingTax.ts` (`ACTIVE_OPENING_TAX_MODEL`) |
| Bonding-curve formula          | Constant product with virtual reserves, calibrated so selling the 800M curve allocation raises exactly the graduation target. Used only for opening-buy cost and price impact            | `src/lib/curve.ts` (`ACTIVE_CURVE_MODEL`)            |
| Virtual token reserve          | The one free parameter of that model. Exposed as an "Advanced assumptions" input. Default 1,067M, derived by assuming the curve's final price equals the graduated pool's starting price | Form input; default in `defaultVirtualTokensM()`     |
| Creation fee and airdrop fee   | User-entered, empty by default, left out of totals until filled. Assumed to be charged in ETH                                                                                            | Form inputs                                          |
| Airdrop reserve bucket         | Shown as a share of total supply only; no claim about which bucket it reduces                                                                                                            | `src/components/results/SupplyMap.tsx`               |
| Pair asset price               | User enters the pair asset's value in ETH; ETH pairs are fixed at 1                                                                                                                      | Form input                                           |
| Base tax on the opening buy    | Shown as a separate line; no claim about whether it is added on top or deducted                                                                                                          | `src/components/results/OpeningBuyEstimate.tsx`      |

Other choices made while building:

- The `source` of each fact is the docs section name as grouped in the original brief (Network, Launch, Tax, Graduation airdrops). `/learn` links to the docs root because per-section URLs were not confirmed.
- Notice thresholds such as "opening buy above 20% of supply" are this tool's own triggers, not protocol rules. They live in `NOTICE_THRESHOLDS` in `assumptions.ts`.
- Name, ticker, and symbol length limits are cosmetic form limits, not protocol rules.
- The supply map uses two aligned bars (the fixed split, and your allocations) with the 50% limit drawn across both, so it does not imply which bucket an allocation comes from.
- TypeScript is pinned to 6.x because `typescript-eslint` does not support TypeScript 7 yet.
- The author's X link in `src/config/site.ts` is a placeholder.

## Deploying to Vercel

Zero configuration, no environment variables.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected defaults (framework: Next.js, package manager: pnpm) and deploy.

Absolute URLs for Open Graph images use Vercel's built-in `VERCEL_PROJECT_PRODUCTION_URL`, so shared links unfurl correctly without setup.

## Contributing

Issues and pull requests are welcome.

- **Wrong number?** Open an issue with a link to the docs page showing the correct value, and a link to your simulation.
- Protocol numbers go in `src/config/protocol.ts` only, with a source. If the docs do not state it, it is an assumption: put it in `assumptions.ts` and badge it in the UI.
- Maths goes in `src/lib` as pure functions with unit tests. Use `bigint` and basis points.
- Notices state facts and consequences. They never judge a configuration or give advice.
- Keep the unofficial label on every page, on the PNG card, and on the OG image. Do not add vibe/vibe branding.
- No wallet code, no backend, no analytics, no third-party scripts.
- Before opening a pull request: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Licence

MIT. See [LICENSE](LICENSE).
