import styles from './ReadinessRing.module.css';

const CIRCUMFERENCE = 251; // r=40, 2πr ≈ 251.327

export function ReadinessRing({ value, label, color }) {
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className={styles.card}>
      <div className={styles.ringWrap}>
        <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="7" className={styles.track} />
          <circle
            cx="50" cy="50" r="40" fill="none" strokeWidth="7"
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={styles.value}
          />
        </svg>
        <div className={styles.center}>
          <div className={styles.val}>{Math.round(value)}</div>
          <div className={styles.unit}>%</div>
        </div>
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
