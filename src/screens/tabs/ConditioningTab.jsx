import { useState } from 'react';
import styles from './ConditioningTab.module.css';
import { ConditioningWarning } from '../../components/ConditioningWarning';
import { FrcBlock } from '../../components/FrcBlock';
import { SESSIONS } from '../../data/sessions';
import { FRC_FULL } from '../../data/frc';
import { useSessionStore } from '../../stores/sessionStore';

// Conditioning protocols: pick 1-2 from the list. Selected protocols get
// buffered into exercisePerf so we know which ones the user actually did.
export function ConditioningTab() {
  const mode = useSessionStore((s) => s.mode);
  const pushPerf = useSessionStore((s) => s.pushExercisePerf);
  const protocols = SESSIONS[mode]?.cond?.protocols ?? SESSIONS.full.cond.protocols;

  const [selected, setSelected] = useState(() => new Set());

  const toggle = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else if (next.size < 2) {
        next.add(i);
        const p = protocols[i];
        pushPerf({
          exercise_key: 'cond_' + p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
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
                onClick={() => toggle(i)}
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
