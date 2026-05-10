import styles from './ReadinessSlider.module.css';
import { useSessionStore } from '../stores/sessionStore';

// Six readiness inputs per spec §4 / §5.
// Battery and Stress come from Athlytic and use a different value tint (blue)
// to signal that they're external/measured rather than self-reported.
const ROWS = [
  { key: 'rec',     label: 'Recovery',   min: 0, max: 100, step: 1, suffix: '%' },
  { key: 'slp',     label: 'Sleep',      min: 0, max: 100, step: 1, suffix: '%' },
  { key: 'body',    label: 'Body feel',  min: 1, max: 5,   step: 1, suffix: '/5' },
  { key: 'mot',     label: 'Motivation', min: 1, max: 5,   step: 1, suffix: '/5' },
  { key: 'battery', label: 'Battery',    sub: 'Athlytic · 0-100', min: 0, max: 100, step: 1, suffix: '%', alt: true },
  { key: 'stress',  label: 'Stress',     sub: 'Athlytic · 0-60',  min: 0, max: 60,  step: 1, suffix: '',  alt: true },
];

export function ReadinessSliders() {
  const setReadiness = useSessionStore((s) => s.setReadiness);
  const values = useSessionStore((s) => ({
    rec: s.rec, slp: s.slp, body: s.body, mot: s.mot, battery: s.battery, stress: s.stress,
  }));

  const adjust = (row, delta) => {
    const next = Math.max(row.min, Math.min(row.max, values[row.key] + delta));
    setReadiness(row.key, next);
  };

  return (
    <div className={styles.card}>
      {ROWS.map((row) => (
        <div className={styles.row} key={row.key}>
          <div className={styles.label}>
            {row.label}
            {row.sub && <span className={styles.subLabel}>{row.sub}</span>}
          </div>
          <button type="button" className={styles.adj} onClick={() => adjust(row, -row.step)} aria-label={`Decrease ${row.label}`}>−</button>
          <input
            type="range"
            className={styles.range}
            min={row.min}
            max={row.max}
            step={row.step}
            value={values[row.key]}
            onChange={(e) => setReadiness(row.key, Number(e.target.value))}
            aria-label={row.label}
          />
          <button type="button" className={styles.adj} onClick={() => adjust(row, row.step)} aria-label={`Increase ${row.label}`}>+</button>
          <div className={`${styles.value} ${row.alt ? styles.alt : ''}`}>
            {values[row.key]}
            {row.suffix}
          </div>
        </div>
      ))}
    </div>
  );
}
