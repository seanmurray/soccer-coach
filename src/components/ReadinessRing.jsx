import styles from './ReadinessRing.module.css';

const CIRCUMFERENCE = 251; // r=40, 2πr ≈ 251.327

// When value is null the input was excluded from today's score — ring is
// drawn at 0 and the centre shows "—" in muted color.
export function ReadinessRing({ value, label, color }) {
  const missing = value == null;
  const pct = missing ? 0 : Math.max(0, Math.min(100, value)) / 100;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className={styles.card}>
      <div className={styles.ringWrap}>
        <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="7" className={styles.track} />
          <circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="7"
            stroke={missing ? 'rgba(255,255,255,0.08)' : color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={styles.value}
          />
        </svg>
        <div className={styles.center}>
          <div className={styles.val} style={missing ? { color: 'var(--t4)' } : undefined}>
            {missing ? '—' : Math.round(value)}
          </div>
          {!missing && <div className={styles.unit}>%</div>}
        </div>
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
