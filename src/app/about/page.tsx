import type { Metadata } from "next";
import { Article, PageIntro } from "@/components/Prose";
import { DOCS_URL, FACT_SOURCES, VERIFIED_ON } from "@/config/protocol";
import { REPORT_WRONG_NUMBER_URL, SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `What ${SITE.name} is, who built it, and where its numbers come from. ${SITE.unofficialLabel}`,
};

export default function AboutPage() {
  return (
    <>
      <PageIntro title={`About ${SITE.name}`}>
        <p>
          {SITE.name} is a free launch simulator for people creating tokens on the vibe/vibe testnet
          launchpad. You enter the settings you plan to use and it shows what they mean before you
          sign anything.
        </p>
      </PageIntro>

      <Article id="unofficial" title="Unofficial and independent">
        <p>
          <strong>{SITE.unofficialLabel}</strong>
        </p>
        <p>
          This is a community project. It does not use vibe/vibe&apos;s logo or artwork, and nothing
          here speaks for the vibe/vibe team. The official docs and the app itself are always the
          source of truth.
        </p>
      </Article>

      <Article id="privacy" title="No wallet, no account, no tracking">
        <p>
          <strong>{SITE.noWalletLabel}</strong> It cannot send transactions. There is no sign-up, no
          backend, and no database. The calculator runs in your browser, and your settings live only
          in the link you choose to share.
        </p>
        <p>
          The site loads no analytics or third-party scripts. The summary-card image for shared
          links is drawn by this site from the settings in the link.
        </p>
      </Article>

      <Article id="advice" title="Not financial advice">
        <p>
          {SITE.name} describes mechanics. It does not say whether any configuration is good, safe,
          or profitable, and nothing here is financial advice. Testnet ETH and tokens have no
          monetary value.
        </p>
      </Article>

      <Article id="sources" title="Where the numbers come from">
        <p>
          Every protocol number in the simulator comes from the{" "}
          <a className="link" href={DOCS_URL} target="_blank" rel="noreferrer">
            official vibe/vibe testnet docs
          </a>
          . Rules last checked: <time dateTime={VERIFIED_ON}>{VERIFIED_ON}</time>.
        </p>
        <p>
          Anything the docs do not state is shown with an &quot;estimate&quot; badge and is never
          presented as fact.
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[30rem] text-sm">
            <caption className="sr-only">
              Protocol facts used by the simulator and their docs sections
            </caption>
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wider text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Fact
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Value used
                </th>
                <th scope="col" className="py-2 font-medium">
                  Docs section
                </th>
              </tr>
            </thead>
            <tbody>
              {FACT_SOURCES.map((fact) => (
                <tr key={fact.label} className="border-b border-line align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-text">
                    {fact.label}
                  </th>
                  <td className="py-2 pr-3 font-mono text-[13px] text-body">{fact.value}</td>
                  <td className="py-2 font-mono text-[13px] text-muted">{fact.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Article>

      <Article id="report" title="Found a wrong number?">
        <p>
          Testnet rules change. If a figure here no longer matches the vibe/vibe app or the official
          docs,{" "}
          <a
            className="link"
            href={REPORT_WRONG_NUMBER_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            report a wrong number
          </a>{" "}
          on GitHub. The form asks which figure is wrong, what {SITE.name} shows, what the app or
          docs show, and for a link or screenshot.
        </p>
      </Article>

      <Article id="author" title="Who built this">
        <p>
          {SITE.name} was built by {SITE.author}. It is open source under the MIT licence.
        </p>
        <ul>
          <li>
            <a className="link" href={SITE.githubUrl} target="_blank" rel="noreferrer">
              Source code on GitHub
            </a>
          </li>
          <li>
            <a className="link" href={SITE.authorGithubUrl} target="_blank" rel="noreferrer">
              {SITE.author} on GitHub
            </a>
          </li>
          <li>
            <a className="link" href={SITE.authorXUrl} target="_blank" rel="noreferrer">
              {SITE.author} on X
            </a>
          </li>
        </ul>
      </Article>
    </>
  );
}
