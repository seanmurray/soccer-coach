import { useState } from 'react';
import { SetRow, SetTableHeader, AdaptNote } from './SetRow';
import { calcLoad, getPhase } from '../lib/periodization';
import { computeNextRec } from '../lib/setAdjust';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useRestTimer } from '../stores/restTimerStore';

// SetTable — owns per-set local state for one exercise, buffers each
// completed set into the session store, and triggers the rest timer.
//
// Adjustment logic lives in lib/setAdjust.js (pure). This component is
// responsible for picking baseRec, threading prescription through, and
// re-rendering when state changes.
//
// `recOverride` — when a swap is active and we have a research-backed ratio,
// the parent passes the pre-scaled base recommendation here. If undefined,
// we fall back to calcLoad on the original exercise key.
// `recOverridePresent` is true even when recOverride is 0/null so we can
// distinguish "we know it's null" from "no override provided".
export function SetTable({
  exerciseKey,
  exerciseName,
  prescription,
  context,
  showWeight = true,
  recOverride,
  recOverridePresent = false,
}) {
  const maxes = useSettingsStore((s) => s.maxes);
  const week = useSessionStore((s) => s.week);
  const dayType = useSessionStore((s) => s.dayType);
  const mode = useSessionStore((s) => s.mode);
  const phase = getPhase(week);
  const pushSet = useSessionStore((s) => s.pushSet);
  const startTimer = useRestTimer((t) => t.start);

  const numSets = prescription?.sets ?? 3;
  const baseReps = prescription?.reps ?? 5;
  const targetRPE = prescription?.target_rpe ?? 8;

  // Base recommendation source:
  //   - if the parent passed an explicit override (swap-aware path), use it
  //   - otherwise fall back to the original exercise's max × pct
  const baseRec = recOverridePresent
    ? (recOverride ?? null)
    : (showWeight ? calcLoad(exerciseKey, prescription?.pct, maxes) : 0);

  // Per-row state. RPE pre-fills to the target so the user only changes it
  // when the set actually felt different (spec response, item 3).
  const [rows, setRows] = useState(() =>
    Array.from({ length: numSets }, () => ({
      reps: null,
      weight: null,
      rpe: targetRPE,
      done: false,
    }))
  );
  const [adaptNote, setAdaptNote] = useState(null);

  // The next-set recommendation accounting for prior completed sets.
  function recForSet(idx) {
    if (!showWeight) return { value: null, variant: 'ok', note: null };
    if (baseRec == null || baseRec === 0) return { value: null, variant: 'ok', note: null };

    const priorRows = rows.slice(0, idx);
    const { rec, note } = computeNextRec({ baseRec, prescription, history: priorRows });

    // Variant against actual weight: warn if drifted >10 lbs, danger >20 lbs.
    const actual = rows[idx]?.weight;
    if (actual == null) return { value: rec, variant: 'ok', note };
    const diff = Math.abs(actual - rec);
    const variant = diff > 20 ? 'danger' : diff > 10 ? 'warn' : 'ok';
    return { value: rec, variant, note };
  }

  function update(idx, patch) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function handleToggleDone(idx) {
    const row = rows[idx];
    const willBeDone = !row.done;

    update(idx, { done: willBeDone });
    if (!willBeDone) return;

    const reps = row.reps ?? baseReps;
    const weight = showWeight ? (row.weight ?? recForSet(idx).value ?? 0) : null;
    const rpe = row.rpe ?? targetRPE;

    pushSet({
      exercise_key: exerciseKey,
      exercise_name: exerciseName,
      set_num: idx + 1,
      actual_reps: reps,
      actual_weight: weight,
      rpe,
      rec_weight: recForSet(idx).value,
      day_type: dayType,
      week_num: week,
      mode,
      phase,
      performed_at: new Date().toISOString(),
    });

    // Surface the adaptation note for the next set, if any.
    if (idx < rows.length - 1) {
      const nextRec = computeNextRec({
        baseRec,
        prescription,
        history: rows.map((r, i) => (i === idx ? { ...r, done: true } : r)).slice(0, idx + 1),
      });
      setAdaptNote(nextRec.note);
    }

    // Rest timer.
    startTimer({ exerciseName, context, week, rpe });
  }

  return (
    <>
      <SetTableHeader showWeight={showWeight} />
      {rows.map((row, idx) => {
        const rec = recForSet(idx);
        return (
          <SetRow
            key={idx}
            setNum={idx + 1}
            reps={row.reps}
            onRepsChange={(v) => update(idx, { reps: v })}
            weight={row.weight}
            onWeightChange={(v) => update(idx, { weight: v })}
            rec={rec.value}
            recVariant={rec.variant}
            rpe={row.rpe}
            onRpeChange={(v) => update(idx, { rpe: v })}
            done={row.done}
            onToggleDone={() => handleToggleDone(idx)}
            showWeight={showWeight}
          />
        );
      })}
      {adaptNote && <AdaptNote>{adaptNote}</AdaptNote>}
    </>
  );
}
