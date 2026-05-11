import styles from './FrcBlock.module.css';
import { useSessionStore } from '../stores/sessionStore';

// Renders a list of FRC mobility items with checkboxes. Used for both the
// short pre-session block (warmup tab) and the full post-conditioning block.
//
// `variant`: 'short' | 'full' — drives which sessionStore field receives the
// checked indices. Persisted to soccer_sessions.metadata on save so the data
// is available for analysis later.
export function FrcBlock({ title, sub, items, variant = 'short' }) {
  const checked = useSessionStore((s) =>
    variant === 'full' ? s.frcFullChecked : s.frcShortChecked
  );
  const setChecked = useSessionStore((s) => s.setFrcChecked);

  const isChecked = (i) => checked.includes(i);
  const toggle = (i) => setChecked(variant, i, !isChecked(i));

  return (
    <div className={styles.card}>
      <div className={styles.label}>{title}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
      {items.map((it, i) => (
        <label key={i} className={styles.item}>
          <input
            type="checkbox"
            className={styles.cb}
            checked={isChecked(i)}
            onChange={() => toggle(i)}
          />
          <div className={styles.content}>
            <div className={styles.text}>{it.text}</div>
            {it.badge && <span className={styles.badge}>{it.badge}</span>}
            {it.cue && <div className={styles.cue}>{it.cue}</div>}
            {it.url && (
              <a href={it.url} target="_blank" rel="noreferrer" className={styles.video}>
                ▸ Watch
              </a>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
