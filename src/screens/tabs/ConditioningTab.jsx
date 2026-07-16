import { useState } from 'react';
import styles from './ConditioningTab.module.css';
import { ConditioningWarning } from '../../components/ConditioningWarning';
import { FrcBlock } from '../../components/FrcBlock';
import { SESSIONS } from '../../data/sessions';
import { FRC_FULL } from '../../data/frc';
import { useSessionStore } from '../../stores/sessionStore';
import { MetricCard } from './MetricCard';

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
  // Stable sort: recommended-for-current-mode first, original order preserved within each group.
  const protocols = SESSIONS.full.cond.protocols
    .map((p, i) => ({ p, i, rec: p.recommendedModes?.includes(mode) ?? true }))
    .sort((a, b) => (b.rec - a.rec) || (a.i - b.i))
    .map(({ p }) => p);

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
        const isRecommended = p.recommendedModes?.includes(mode) ?? true;
        const warning = !isRecommended ? p.notRecommendedReason : null;

        // Both tracked kinds render through MetricCard now — it handles 1 set
        // or N off `protocol.sets`. The `kind` values are kept so untracked
        // pick-only protocols still fall through to the generic card below.
        if (p.kind === 'norwegian_4x4' || p.kind === 'single_metric') {
          return <MetricCard key={p.exercise_key ?? p.name} protocol={p} warning={warning} />;
        }
        const isSel = selected.has(i);
        return (
          <div key={p.name} className={`${styles.protocol} ${warning ? styles.notRecommended : ''}`}>
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
              {warning && <div className={styles.warning}>{warning}</div>}
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
