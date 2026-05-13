import { useState } from 'react';
import styles from './ConditioningTab.module.css';
import { ConditioningWarning } from '../../components/ConditioningWarning';
import { FrcBlock } from '../../components/FrcBlock';
import { SESSIONS } from '../../data/sessions';
import { FRC_FULL } from '../../data/frc';
import { useSessionStore } from '../../stores/sessionStore';
import { SingleMetricCard } from './SingleMetricCard';

// Conditioning protocols: pick 1-2 from the list. Selected protocols get
// buffered into exercisePerf so we know which ones the user actually did.
//
// One protocol — Norwegian 4x4 — has `kind: 'norwegian_4x4'` and renders a
// structured input for the four high-intensity intervals (mph each). The
// average speed gets encoded into notes as the primary measurement so the
// Progress charts can plot it over time.
export function ConditioningTab() {
  const mode = useSessionStore((s) => s.mode);
  const pushPerf = useSessionStore((s) => s.pushExercisePerf);
  const protocols = SESSIONS[mode]?.cond?.protocols ?? SESSIONS.full.cond.protocols;

  // Generic-selection state for non-structured protocols.
  const [selected, setSelected] = useState(() => new Set());

  const protocolKey = (p) =>
    p.exercise_key ?? ('cond_' + p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));

  const toggleGeneric = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else if (next.size < 2) {
        next.add(i);
        const p = protocols[i];
        pushPerf({
          exercise_key: protocolKey(p),
          exercise_name: p.name,
          exercise_type: 'cond',
          day_type: 'cond',
          quality: null,
          effort_rpe: p.rpe,
          ease: null,
          notes: p.desc,
          performed_at: new Date().toISOString(),
        });
      }
      return next;
    });
  };

  return (
    <>
      <ConditioningWarning />

      <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Pick 1-2 protocols
      </div>

      {protocols.map((p, i) => {
        if (p.kind === 'norwegian_4x4') {
          return <Norwegian4x4Card key={p.exercise_key ?? p.name} protocol={p} />;
        }
        if (p.kind === 'single_metric') {
          return <SingleMetricCard key={p.exercise_key ?? p.name} protocol={p} />;
        }
        const isSel = selected.has(i);
        return (
          <div key={p.name} className={styles.protocol}>
            <div className={styles.head}>
              <div>
                <div className={styles.name}>{p.name}</div>
                <div className={styles.rpe}>RPE {p.rpe}</div>
              </div>
              <button
                type="button"
                className={`${styles.select} ${isSel ? styles.selected : ''}`}
                onClick={() => toggleGeneric(i)}
              >
                {isSel ? 'Selected ✓' : 'Pick'}
              </button>
            </div>
            <div className={styles.body}>
              <div className={styles.desc}>{p.desc}</div>
            </div>
          </div>
        );
      })}

      <FrcBlock
        variant="full"
        title="FRC Post-Conditioning — ~20 min"
        sub="Full mobility + lower-leg stiffness. Run after the conditioning block, not before."
        items={FRC_FULL}
      />
    </>
  );
}

// Norwegian 4x4 — captures per-interval mph + auto-averages.
// Encoded notes format:
//   [8.75 mph · int1:8.5 · int2:8.5 · int3:9 · int4:9]
// First tag is the primary measurement (avg mph) — measurementParse picks
// that up so the value flows into the Progress charts under exercise_key
// = 'norwegian_4x4'.
function Norwegian4x4Card({ protocol }) {
  const dayType = useSessionStore((s) => s.dayType);
  const pushPerf = useSessionStore((s) => s.pushExercisePerf);

  const [intervals, setIntervals] = useState(['', '', '', '']);
  const [saved, setSaved] = useState(false);

  const nums = intervals.map((v) => (v === '' ? null : Number(v)));
  const validCount = nums.filter((n) => Number.isFinite(n) && n > 0).length;
  const avg = validCount === 4
    ? Math.round((nums.reduce((a, b) => a + b, 0) / 4) * 100) / 100
    : null;

  const onLog = () => {
    if (avg == null) return;
    const tags = [
      `${avg} mph`,
      ...nums.map((n, i) => `int${i + 1}:${n}`),
    ];
    pushPerf({
      exercise_key: 'norwegian_4x4',
      exercise_name: 'Norwegian 4x4',
      exercise_type: 'cond',
      day_type: dayType,
      quality: null,
      effort_rpe: protocol.rpe,
      ease: null,
      notes: `[${tags.join(' · ')}]`,
      performed_at: new Date().toISOString(),
    });
    setSaved(true);
  };

  const updateInterval = (idx, value) => {
    setIntervals((prev) => prev.map((v, i) => (i === idx ? value : v)));
    setSaved(false);
  };

  return (
    <div className={styles.protocol}>
      <div className={styles.head}>
        <div>
          <div className={styles.name}>{protocol.name}</div>
          <div className={styles.rpe}>RPE {protocol.rpe} · 40 min total</div>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.desc}>{protocol.desc}</div>

        <div className={styles.intervalGrid}>
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} className={styles.intervalCell}>
              <div className={styles.intervalLabel}>Int {n}</div>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="mph"
                className={styles.intervalInput}
                value={intervals[i]}
                onChange={(e) => updateInterval(i, e.target.value)}
              />
              <div className={styles.intervalUnit}>mph</div>
            </div>
          ))}
        </div>

        <div className={styles.avgRow}>
          <div className={styles.avgLabel}>Average</div>
          <div className={styles.avgValue}>{avg != null ? `${avg} mph` : '—'}</div>
        </div>

        <button
          type="button"
          className={`${styles.logBtn} ${saved ? styles.saved : ''}`}
          onClick={onLog}
          disabled={avg == null || saved}
        >
          {saved ? 'Logged ✓' : 'Log 4×4 intervals'}
        </button>
      </div>
    </div>
  );
}
