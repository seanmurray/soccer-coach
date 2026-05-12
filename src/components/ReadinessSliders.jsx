import styles from './ReadinessSlider.module.css';
import { useShallow } from 'zustand/react/shallow';
import { useSessionStore } from '../stores/sessionStore';

// Six readiness inputs per spec §4 / §5.
// Battery and Stress come from Athlytic and use a different value tint (blue)
// to signal that they're external/measured rather than self-reported.
//
// Each row has a "skip" toggle that excludes the input from the composite
// score — useful when you didn't wear the watch overnight and don't have a
// real number to enter. Excluded values save as null to soccer_sessions.
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
  const toggleExclude = useSessionStore((s) => s.toggleReadinessExclude);
  // useShallow does a per-key Object.is compare so the wrapper object doesn't
  // make Zustand think every render produced a new snapshot.
  const values = useSessionStore(
    useShallow((s) => ({
      rec: s.rec, slp: s.slp, body: s.body, mot: s.mot, battery: s.battery, stress: s.stress,
    }))
  );

  const adjust = (row, delta) => {
    const cur = values[row.key];
    if (cur == null) return; // can't adjust an excluded slider — re-include first
    const next = Math.max(row.min, Math.min(row.max, cur + delta));
    setReadiness(row.key, next);
  };

  return (
    <div className={styles.card}>
      {ROWS.map((row) => {
        const value = values[row.key];
        const excluded = value == null;
        const displayValue = excluded ? null : value;
        return (
          <div key={row.key} className={`${styles.row} ${excluded ? styles.excluded : ''}`}>
            <div className={styles.label}>
              {row.label}
              {row.sub && <span className={styles.subLabel}>{row.sub}</span>}
            </div>
            <button type="button" className={styles.adj} onClick={() => adjust(row, -row.step)} disabled={excluded} aria-label={`Decrease ${row.label}`}>−</button>
            <input
              type="range"
              className={styles.range}
              min={row.min}
              max={row.max}
              step={row.step}
              // Slider needs a numeric value even when excluded — fall back to
              // the last-known value or row.min so the thumb has a position.
              value={value ?? row.min}
              onChange={(e) => setReadiness(row.key, Number(e.target.value))}
              disabled={excluded}
              aria-label={row.label}
            />
            <button type="button" className={styles.adj} onClick={() => adjust(row, row.step)} disabled={excluded} aria-label={`Increase ${row.label}`}>+</button>
            <div className={`${styles.value} ${row.alt ? styles.alt : ''} ${excluded ? styles.excluded : ''}`}>
              {displayValue == null ? '—' : `${displayValue}${row.suffix}`}
            </div>
            <button
              type="button"
              className={`${styles.skip} ${excluded ? styles.on : ''}`}
              onClick={() => toggleExclude(row.key)}
              aria-pressed={excluded}
              aria-label={excluded ? `Include ${row.label}` : `Skip ${row.label}`}
              title={excluded ? 'Include this input' : 'Skip — no data today'}
            >
              {excluded ? '+' : '–'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
