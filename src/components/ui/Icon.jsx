// Small line icons drawn as SVG. Unicode symbols (✕ ↺ ◷ ⇄) depend on font
// fallback, which some iOS builds render as empty boxes — SVG always draws.
const PATHS = {
  wave: <path d="M2.5 12h4l2.5-6 4 12 3-8 1.5 2h4" />,
  bolt: <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  list: <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  reset: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v4h4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 2M10 3h4" />
    </>
  ),
  swap: (
    <>
      <path d="M5 8h13l-3.5-3.5" />
      <path d="M19 16H6l3.5 3.5" />
    </>
  ),
};

export function Icon({ name, size = 22, strokeWidth = 1.9, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
