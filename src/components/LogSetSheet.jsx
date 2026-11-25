import { useState } from 'react';
import { FullSheet, PillButton, SwitchRow } from './ui/FullSheet';
import { Stepper } from './ui/Stepper';
import uiStyles from './ui/ui.module.css';
import { useRestTimer } from '../stores/restTimerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { RPE_WORDS, fmtClock } from '../lib/workoutFormat';

// "Performance" sheet for logging one set: weight / reps (or seconds) / RPE
// steppers, the Auto Timer switch, and DONE. Opens pre-filled — the caller
// passes the best guess (today's rec, else the previous set) so most sets
// are a single tap on DONE.
//
// Mount it with a `key` per set so the local draft resets between sets.
export function LogSetSheet({
  open,
  title,            // e.g. "Back squat · Set 2"
  initial,          // { weight, reps, rpe }
  showWeight = true,
  unit = 'reps',    // 'reps' | 'secs'
  logged = false,   // already logged → show Reset
  onDone,           // ({ weight, reps, rpe }) => void
  onReset,
  onClose,
}) {
  const [weight, setWeight] = useState(initial?.weight ?? null);
  const [reps, setReps] = useState(initial?.reps ?? null);
  const [rpe, setRpe] = useState(initial?.rpe ?? 8);

  const timerVisible = useRestTimer((t) => t.visible);
  const remaining = useRestTimer((t) => t.remaining);
  const autoStart = useSettingsStore((s) => s.timerPrefs.autoStart);
  const setTimerPref = useSettingsStore((s) => s.setTimerPref);

  const confirmReset = () => {
    if (window.confirm('Reset set? This clears the logged numbers for this set. The set stays in your workout.')) {
      onReset?.();
    }
  };

  const headerActions = (
    <>
      {timerVisible && (
        <div className={`${uiStyles.iconBtn} ${uiStyles.timerPill}`} aria-label="Rest remaining">
          ◷ {fmtClock(remaining)}
        </div>
      )}
      {logged && onReset && (
        <button type="button" className={uiStyles.iconBtn} onClick={confirmReset} aria-label="Reset set">
          ↺
        </button>
      )}
    </>
  );

  return (
    <FullSheet
      open={open}
      title="Performance"
      label={title}
      onClose={onClose}
      headerActions={headerActions}
      footer={
        <PillButton onClick={() => onDone({ weight: showWeight ? weight : null, reps, rpe })}>
          ✓ DONE
        </PillButton>
      }
    >
      {title && <div style={{ color: 'var(--t3)', fontSize: 16, margin: '4px 4px 12px' }}>{title}</div>}

      {showWeight && (
        <Stepper
          label="Weight"
          value={weight}
          onChange={setWeight}
          step={5}
          max={2000}
          decimal
          unit="lb"
        />
      )}

      <Stepper
        label={unit === 'secs' ? 'Seconds' : 'Reps'}
        value={reps}
        onChange={setReps}
        step={unit === 'secs' ? 5 : 1}
        max={unit === 'secs' ? 600 : 100}
      />

      <Stepper
        label="Rate of Perceived Exertion"
        value={rpe}
        onChange={(v) => setRpe(v == null ? null : Math.min(10, Math.max(5, v)))}
        step={0.5}
        min={5}
        max={10}
        decimal
        hint={RPE_WORDS[rpe] ?? ' '}
      />

      <SwitchRow
        label="Auto Timer"
        checked={!!autoStart}
        onChange={(v) => setTimerPref('autoStart', v)}
        accent
      />
    </FullSheet>
  );
}
