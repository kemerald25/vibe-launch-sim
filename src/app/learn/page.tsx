import type { Metadata } from "next";
import Link from "next/link";
import { Article, PageIntro } from "@/components/Prose";
import { ASSUMPTION_LIST } from "@/config/assumptions";
import { DOCS_URL, PROTOCOL, VERIFIED_ON } from "@/config/protocol";
import { SITE } from "@/config/site";
import { BPS_DENOMINATOR, formatBps, formatTokens } from "@/lib/units";

export const metadata: Metadata = {
  title: "Learn the launch mechanics",
  description: `A plain-language guide to how a vibe/vibe testnet launch works. ${SITE.unofficialLabel}`,
};

const { launch, tax, airdrop, network } = PROTOCOL;
const taxOptions = tax.baseOptionsBps.value.map((b) => formatBps(b));
const routes = Object.values(tax.routes.value);
const audiences = Object.values(airdrop.audiences.value);
const project = formatBps(tax.projectShareBps.value);
const protocol = formatBps(tax.protocolShareBps.value);
const windowSeconds = tax.openingWindowSeconds.value;
const cap = formatBps(launch.maxCreatorAllocationBps.value);
const eth = network.currency.value;

// The docs' worked example, recomputed from the protocol config rather than typed in.
const example = tax.workedExample.value;
const exampleTax = (example.tradeUsd * example.taxBps) / BPS_DENOMINATOR;
const exampleProject = (exampleTax * tax.projectShareBps.value) / BPS_DENOMINATOR;
const usd = (n: number) => n.toLocaleString("en-US");

export default function LearnPage() {
  return (
    <>
      <PageIntro title="How a launch works, in plain language">
        <p>
          This page explains each launch mechanic in our own words. It is a study aid, not the
          rulebook. The{" "}
          <a className="link" href={DOCS_URL} target="_blank" rel="noreferrer">
            official vibe/vibe docs
          </a>{" "}
          are the source of truth, and the review screen in the app is the final word on your own
          launch.
        </p>
        <p className="font-mono text-[13px] text-muted">
          Rules last checked <time dateTime={VERIFIED_ON}>{VERIFIED_ON}</time>.{" "}
          {SITE.unofficialLabel}
        </p>
      </PageIntro>

      <nav aria-label="On this page" className="border-t border-line py-5">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px]">
          {[
            ["network", "Network"],
            ["supply", "Supply"],
            ["pair", "Pair asset"],
            ["graduation", "Graduation"],
            ["tax", "Tax"],
            ["routing", "Tax routing"],
            ["opening", `First ${windowSeconds} seconds`],
            ["allocation", "Opening buy and airdrop"],
            ["locked", "What gets locked"],
            ["costs", "Launch costs"],
            ["estimates", "What this tool estimates"],
          ].map(([id, label]) => (
            <li key={id}>
              <a className="link inline-flex min-h-8 items-center" href={`#${id}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Article id="network" title="It all happens on a testnet" docsLabel="Network">
        <p>
          vibe/vibe currently runs on <strong>{network.name.value}</strong> (chain ID{" "}
          {network.chainId.value}). Gas is paid in testnet {eth}, which you get from a faucet.
        </p>
        <p>
          <strong>Testnet {eth} and testnet tokens have no monetary value.</strong> Nothing you
          launch or trade there is worth real money. It is a place to learn how the mechanics
          behave.
        </p>
        <ul>
          <li>RPC: {network.rpcUrl.value}</li>
          <li>Explorer: {network.explorer.value}</li>
          <li>Faucet: {network.faucet.value}</li>
        </ul>
      </Article>

      <Article id="supply" title="Every token has the same supply split" docsLabel="Launch">
        <p>
          Each launch mints <strong>{formatTokens(launch.totalSupply.value)} tokens</strong>. The
          split is fixed:
        </p>
        <ul>
          <li>
            <strong>{formatTokens(launch.curveSupply.value)}</strong> are sold through the bonding
            curve, the built-in market that sells tokens at a rising price.
          </li>
          <li>
            <strong>{formatTokens(launch.liquiditySupply.value)}</strong> are set aside to become
            trading liquidity once the token graduates.
          </li>
        </ul>
        <p>
          You can also tag the project with a type (
          {Object.values(launch.projectTypes.value).join(", ")}). The tag is optional.
        </p>
      </Article>

      <Article id="pair" title="You pick what the token trades against" docsLabel="Launch">
        <p>
          The pair asset is what buyers pay with and what sellers receive. It can be {eth}, a
          stock-labelled test asset, an ecosystem token, or another token that has already
          graduated. The list of available pairs changes, and the app shows the current options when
          you create.
        </p>
        <p>
          One thing to watch: if you pair against another graduated vibe/vibe token,{" "}
          <strong>that token&apos;s own tax can apply as well</strong>. A trade can then pay two
          taxes: yours and the paired token&apos;s.
        </p>
      </Article>

      <Article id="graduation" title="Graduation: when the curve sells out" docsLabel="Launch">
        <p>
          Each curve has a target, set in units of the pair asset when the token is created. The app
          describes it as roughly {String(launch.graduationTargetApproxEth.value)} {eth} of value.
          When a buy fills the curve, graduation happens inside that same buy.
        </p>
        <p>
          After graduation, trading moves to a {launch.graduationVenue.value} pool, and the
          liquidity position is <strong>locked permanently</strong>. Nobody can withdraw it.
        </p>
        <p>
          Graduation is not guaranteed. If a token never fills its curve, there is{" "}
          <strong>no automatic refund and no expiry</strong>. The token simply stays on the curve.
        </p>
      </Article>

      <Article id="tax" title="The base tax" docsLabel="Tax">
        <p>
          You choose a base tax of {taxOptions.join(", ")}. It applies to{" "}
          <strong>both buys and sells</strong>, for the life of the token.
        </p>
        <p>
          The tax itself is then divided: <strong>{project} is the project share</strong> and{" "}
          <strong>{protocol} is the protocol share</strong>. These percentages divide the tax, not
          the trade. With a {formatBps(example.taxBps)} tax on a ${usd(example.tradeUsd)} trade, the
          tax is ${usd(exampleTax)}. Of that ${usd(exampleTax)}, ${usd(exampleProject)} is the
          project share and ${usd(exampleTax - exampleProject)} is the protocol share.
        </p>
      </Article>

      <Article id="routing" title="Routing the project share" docsLabel="Tax">
        <p>
          You decide where the project share goes by setting weights across four routes. The weights
          must use the whole share, so they always add up to 100%.
        </p>
        <ul>
          {routes.map((route) => (
            <li key={route.label}>
              <strong>{route.label}</strong>
            </li>
          ))}
        </ul>
        <p>
          Holder rewards are <strong>pull-based</strong>: holders have to claim them, and nothing is
          sent automatically. Rewards paid in the pair asset can be collected while the token is
          still on the curve or after it graduates. Rewards paid in the launched token build up from
          trading and only become claimable <strong>after graduation</strong>.
        </p>
      </Article>

      <Article id="opening" title={`The first ${windowSeconds} seconds`} docsLabel="Tax">
        <p>
          For the first {windowSeconds} seconds after launch, buys on the curve pay a much higher
          opening rate. It starts at {formatBps(tax.openingStartRateBps.value)} and falls to your
          base tax by second {windowSeconds}.
        </p>
        <ul>
          <li>Sells do not pay the surcharge.</li>
          <li>
            The creator&apos;s opening buy, which happens in the same transaction as the launch,
            does not pay the surcharge.
          </li>
          <li>
            The extra amount above your base rate goes to the protocol. It is not part of the
            project share.
          </li>
        </ul>
        <p>
          The docs say the rate falls over {windowSeconds} seconds but do not say what shape the
          fall takes. {SITE.name} draws a straight line and labels it as an estimate.
        </p>
      </Article>

      <Article
        id="allocation"
        title="Opening buy and graduation airdrop"
        docsLabel="Graduation airdrops"
      >
        <p>
          As the creator, you can buy part of the supply in the launch transaction (the opening
          buy), and you can reserve part of the supply for a graduation airdrop.{" "}
          <strong>Together these cannot be more than {cap} of supply.</strong>
        </p>
        <p>
          For an airdrop, you reserve the supply and choose who receives it before trading starts.
          The audiences are: {audiences.join(", ")}.
        </p>
        <p>
          The airdrop is <strong>only distributed if the token completes its curve</strong>. No
          graduation, no distribution.
        </p>
      </Article>

      <Article id="locked" title="What you cannot change after launch" docsLabel="Launch">
        <p>These are fixed at creation and cannot be edited later:</p>
        <ul>
          <li>The pair asset</li>
          <li>The base tax</li>
          <li>The tax routing weights</li>
          <li>The graduation target</li>
          <li>The holder books</li>
          <li>The airdrop campaign, including its audience allocation and recipient shortlist</li>
        </ul>
        <p>
          That is the reason this tool exists: it is easier to understand a setting before it is
          permanent.{" "}
          <Link className="link" href="/">
            Try your settings in the simulator
          </Link>
          .
        </p>
      </Article>

      <Article id="costs" title="What a launch costs" docsLabel="Launch">
        <p>A launch has up to four costs:</p>
        <ul>
          {launch.launchCostItems.value.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          The fees are live values and are not published in the docs. The app shows all of them on
          its review screen before you sign. {SITE.name} lets you type the fees in, and leaves them
          out of totals until you do.
        </p>
      </Article>

      <Article id="estimates" title="What this tool estimates, and why">
        <p>
          Some details are not in the docs. Where {SITE.name} needs one, it uses a clearly labelled
          assumption that you can see and, where it makes sense, change. If the app&apos;s review
          screen disagrees with this tool, trust the app.
        </p>
        <ul>
          {ASSUMPTION_LIST.map((assumption) => (
            <li key={assumption.id}>
              <strong>{assumption.title}.</strong> {assumption.detail}
            </li>
          ))}
        </ul>
      </Article>
    </>
  );
}
