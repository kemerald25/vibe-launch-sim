import type { ReactNode } from "react";
import { DOCS_URL } from "@/config/protocol";

export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="max-w-2xl py-8 sm:py-10">
      <h1 className="text-2xl leading-tight sm:text-[2rem]">{title}</h1>
      <div className="mt-3 space-y-3 text-base text-body">{children}</div>
    </header>
  );
}

export function Article({
  id,
  title,
  docsLabel,
  children,
}: {
  id: string;
  title: string;
  /** When set, adds a link to the official docs under the section. */
  docsLabel?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-16 border-t border-line py-7"
    >
      <h2 id={`${id}-title`} className="text-lg">
        {title}
      </h2>
      <div className="mt-3 max-w-2xl space-y-3 text-[15px] leading-relaxed text-body [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-text [&_ul]:space-y-1.5">
        {children}
      </div>
      {docsLabel ? (
        <p className="mt-4 font-mono text-[13px]">
          <a className="link" href={DOCS_URL} target="_blank" rel="noreferrer">
            Official docs: {docsLabel}
          </a>
        </p>
      ) : null}
    </section>
  );
}
