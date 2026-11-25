// Small line icons drawn as SVG. Unicode symbols (✕ ↺ ◷ ⇄) depend on font
// fallback, which some iOS builds render as empty boxes — SVG always draws.
const PATHS = {
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
