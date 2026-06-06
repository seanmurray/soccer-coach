import styles from './BottomNav.module.css';

const TABS = [
  { id: 'today',    label: 'Today',    icon: '🔥' },
  { id: 'library',  label: 'Moves',    icon: '📚' },
  { id: 'progress', label: 'Progress', icon: '🏆' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.tab} ${active === t.id ? styles.active : ''}`}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className={styles.icon}>{t.icon}</span>
          <span className={styles.label}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
