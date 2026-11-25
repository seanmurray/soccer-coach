import styles from './BottomNav.module.css';

// Line icons drawn on a 24px grid, stroke = currentColor so the active tab
// picks up the accent via CSS.
const ICONS = {
  today: (
    <>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l4-4" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  workout: (
    <>
      <path d="M8.5 12h7" />
      <rect x="5" y="7" width="3.5" height="10" rx="1.2" />
      <rect x="15.5" y="7" width="3.5" height="10" rx="1.2" />
      <path d="M2.5 10v4M21.5 10v4" />
    </>
  ),
  load: <path d="M2.5 12h4l2.5-6 4 12 3-8 1.5 2h4" />,
  history: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  progress: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7.5 14.5l3.5-4 3 2.5 5-6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </>
  ),
};

const TABS = [
  { id: 'today',    label: 'Today' },
  { id: 'workout',  label: 'Workout' },
  { id: 'load',     label: 'Load' },
  { id: 'history',  label: 'History' },
  { id: 'progress', label: 'Progress' },
  { id: 'settings', label: 'Settings' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav className={styles.bnav} aria-label="Primary navigation">
      <div className={styles.pill}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.item} ${active === t.id ? styles.active : ''}`}
            onClick={() => onChange(t.id)}
            aria-current={active === t.id ? 'page' : undefined}
          >
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {ICONS[t.id]}
            </svg>
            <span className={styles.label}>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
