import type { ReactNode } from "react";
import { TRUST_APP_NOTE } from "@/config/assumptions";

export const inputClass =
  "block min-h-11 w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm text-text placeholder:text-muted aria-[invalid=true]:border-danger";

export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line px-4 py-2 font-mono text-sm font-medium text-text hover:border-muted disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 py-2 font-mono text-sm font-medium text-accent-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

/** Marks any number that comes from a model or user-entered assumption, not from the docs. */
export function EstimateBadge({ label = "Estimate" }: { label?: string }) {
  return (
    <span
      title={TRUST_APP_NOTE}
      className="inline-flex shrink-0 items-center rounded-sm bg-soft px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide text-accent"
    >
      {label}
    </span>
  );
}

export function EstimateNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-muted">
      {children} {TRUST_APP_NOTE}
    </p>
  );
}

export function Panel({
  id,
  title,
  badge,
  intro,
  children,
}: {
  id: string;
  title: string;
  badge?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="rounded-md border border-line bg-panel p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${id}-title`} className="text-base">
          {title}
        </h2>
        {badge}
      </div>
      {intro ? <p className="mt-1.5 text-sm text-muted">{intro}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Label, optional hint and inline error wired up for assistive tech. */
export function Field({
  id,
  label,
  hint,
  error,
  badge,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="font-mono text-[13px] font-medium text-text">
          {label}
        </label>
        {badge}
      </div>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] leading-snug text-danger">
      {message}
    </p>
  );
}

/** aria-describedby value for an input inside <Field>. */
export function describedBy(id: string, hint: boolean, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function DataRow({
  label,
  value,
  sub,
  strong,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <dt className="text-sm text-body">{label}</dt>
      <dd className="text-right">
        <span className={`font-mono text-sm ${strong ? "font-medium text-accent" : "text-text"}`}>
          {value}
        </span>
        {sub ? <span className="block font-mono text-xs text-muted">{sub}</span> : null}
      </dd>
    </div>
  );
}
