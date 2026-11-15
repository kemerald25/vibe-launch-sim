/** Preflight's own mark: a checklist tick over a runway line. Not derived from any vibe/vibe asset. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="4"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />
      <path
        d="M6.5 11.5l3.5 3.5 7.5-8"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      <path d="M6.5 18.5h11" stroke="var(--text)" strokeWidth="1.5" strokeDasharray="2.5 2" />
    </svg>
  );
}
