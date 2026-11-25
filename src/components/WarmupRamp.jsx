import { useState } from 'react';
import setStyles from './SetList.module.css';
import styles from './WarmupRamp.module.css';
import { FullSheet, PillButton } from './ui/FullSheet';
import { useSessionStore } from '../stores/sessionStore';
import { rampSets, RAMP_BAR as BAR } from '../lib/workoutFormat';

// "Warmup  +" row on a main lift. Opens a sheet of ramp sets to check off.
// Ramp sets are NOT working sets — they never save to soccer_sets.
export function WarmupRamp({ exerciseKey, exerciseName, topWeight }) {
  const sets = rampSets(topWeight);
  const checked = useSessionStore((s) => s.rampChecked[exerciseKey] ?? []);
  const setChecked = useSessionStore((s) => s.setRampChecked);
  const [open, setOpen] = useState(false);

  if (sets.length === 0) return null;
  const allDone = sets.every((_, i) => checked.includes(i));

  return (
    <>
      <div className={`${setStyles.row} ${styles.row}`}>
        <div className={styles.label}>Warmup</div>
        {allDone ? (
          <button type="button" className={styles.done} onClick={() => setOpen(true)}>✓ Completed</button>
        ) : (
          <button type="button" className={`${setStyles.plus} ${setStyles.plusOn}`} onClick={() => setOpen(true)} aria-label="Open warm-up sets">
            +
          </button>
        )}
      </div>

      <FullSheet
        open={open}
        title="Warmup"
        label={`${exerciseName} warm-up sets`}
        onClose={() => setOpen(false)}
        footer={<PillButton onClick={() => setOpen(false)}>✓ DONE</PillButton>}
      >
        <div className={styles.sub}>{exerciseName} · building to {topWeight} lb</div>
        {sets.map((s, i) => {
          const on = checked.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`${styles.ramp} ${on ? styles.rampOn : ''}`}
              onClick={() => setChecked(exerciseKey, i, !on)}
              aria-pressed={on}
            >
              <span className={styles.rampWeight}>
                {s.weight}<span className={styles.rampUnit}> lb</span>
              </span>
              <span className={styles.rampReps}>
                {s.reps} reps{s.weight === BAR ? ' · empty bar' : ''}
              </span>
              <span className={styles.check} aria-hidden>{on ? '✓' : ''}</span>
            </button>
          );
        })}
        <div className={styles.top}>
          <span>Target top set</span>
          <strong>{topWeight} lb</strong>
        </div>
      </FullSheet>
    </>
  );
}
