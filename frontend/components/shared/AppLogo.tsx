interface MarkProps {
  className?: string;
  size?: number;
}

/**
 * Nexus mark — two nodes joined by a link, reading as an "N".
 * The nodes are the two sides of a deal (client and freelancer); the
 * diagonal is the connection between them.
 *
 * Drawn in `currentColor`, so it inherits whatever text colour the
 * surrounding badge already uses.
 */
export function NexusMark({ className, size }: MarkProps) {
  return (
    <svg
      viewBox="6 6 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      role="img"
      aria-label="Nexus"
    >
      <path d="M14.5 33.5 V16.5" stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" />
      <circle cx="14.5" cy="33.5" r="6.2" fill="currentColor" />
      <path d="M14.5 16.5 L33.5 31.5" stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M33.5 14.5 V31.5" stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" />
      <circle cx="33.5" cy="14.5" r="6.2" fill="currentColor" />
    </svg>
  );
}

/**
 * The full brand mark in its own colours, for use on a plain surface
 * (no badge behind it).
 */
export function NexusMarkColor({ className, size }: MarkProps) {
  return (
    <svg
      viewBox="6 6 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      role="img"
      aria-label="Nexus"
    >
      <path d="M14.5 33.5 V16.5" stroke="#1E3A8A" strokeWidth="7.5" strokeLinecap="round" />
      <circle cx="14.5" cy="33.5" r="6.2" fill="#1E3A8A" />
      <path d="M14.5 16.5 L33.5 31.5" stroke="#60A5FA" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M33.5 14.5 V31.5" stroke="#2563EB" strokeWidth="7.5" strokeLinecap="round" />
      <circle cx="33.5" cy="14.5" r="6.2" fill="#2563EB" />
    </svg>
  );
}
