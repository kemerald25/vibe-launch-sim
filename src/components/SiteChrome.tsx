import Link from "next/link";
import { DOCS_URL, PROTOCOL, VERIFIED_ON } from "@/config/protocol";
import { REPORT_WRONG_NUMBER_URL, SITE } from "@/config/site";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

/** Unofficial label plus site header, pinned to the top of every page. */
export function SiteTopBar() {
  return (
    <div className="sticky top-0 z-20 bg-bg">
      <UnofficialBanner />
      <SiteHeader />
    </div>
  );
}

/** Always-visible label. */
export function UnofficialBanner() {
  return (
    <div
      role="note"
      data-testid="unofficial-label"
      className="border-b border-line bg-surface px-4 py-1.5 text-center font-mono text-[11px] leading-snug text-muted sm:text-xs"
    >
      {SITE.unofficialLabel}
    </div>
  );
}

const navLink =
  "inline-flex h-10 items-center rounded-md px-2.5 font-mono text-sm text-body hover:text-text";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 font-mono text-base font-medium tracking-tight text-text"
        >
          <Logo />
          {SITE.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-0.5">
          <Link href="/learn" className={navLink}>
            Learn
          </Link>
          <Link href="/about" className={navLink}>
            About
          </Link>
          <span className="ml-1.5">
            <ThemeToggle />
          </span>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm text-muted">
        <p className="text-body">{SITE.unofficialLabel}</p>
        <p>
          {SITE.noWalletLabel} No transactions, no accounts, no tracking. Everything runs in your
          browser.
        </p>
        <p>
          Rules last checked <time dateTime={VERIFIED_ON}>{VERIFIED_ON}</time> against the{" "}
          <a className="link" href={DOCS_URL} target="_blank" rel="noreferrer">
            official vibe/vibe docs
          </a>
          . {PROTOCOL.network.name.value} {PROTOCOL.network.currency.value} and tokens have no
          monetary value. Nothing here is financial advice.
        </p>
        <p>
          Built by {SITE.author}.{" "}
          <a className="link" href={SITE.githubUrl} target="_blank" rel="noreferrer">
            Source on GitHub
          </a>{" "}
          ·{" "}
          <a
            className="link"
            href={REPORT_WRONG_NUMBER_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Report a wrong number
          </a>
        </p>
      </div>
    </footer>
  );
}
