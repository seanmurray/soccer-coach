import { useState } from 'react';
import styles from './SetList.module.css';
import { AdaptNote } from './SetRow';
import { LogSetSheet } from './LogSetSheet';
import { SwitchRow } from './ui/FullSheet';
import { calcLoad, getPhase } from '../lib/periodization';
import { computeNextRec, seedBaseRec, topSet } from '../lib/setAdjust';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useRestTimer } from '../stores/restTimerStore';
import { useLogPrefs } from '../hooks/useLogPrefs';

// Settings block for the ⓘ sheet: reps ↔ seconds, and bodyweight ↔ weighted.
export function LogPrefsControls({ exerciseKey, showWeight = true }) {
  const p = useLogPrefs(exerciseKey, showWeight);
  return (
    <>
      <SwitchRow label="Log in seconds (not reps)" checked={p.unit === 'secs'} onChange={p.toggleUnit} accent />
      {p.canToggleWeight && (
        <SwitchRow label="Track added weight" checked={p.effShowWeight} onChange={p.toggleWeight} accent />
      )}
    </>
  );
}

const fmtNum = (n) => (n == null ? '—' : Number.isInteger(n) ? String(n) : String(n));

// SetTable — owns per-set state for one exercise, buffers each completed set
// into the session store, and triggers the rest timer.
//
// UI: numbered set rows. The first unlogged set is "current" (blue number,
// lit + button). Tapping + opens the LogSetSheet pre-filled with today's
// recommendation (or the previous set); DONE logs it and starts rest. Logged
// rows read "230lb × 5 @ 8 ›" and reopen the sheet to edit or reset.
//
// Adjustment logic lives in lib/setAdjust.js (pure).
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
  const removeSet = useSessionStore((s) => s.removeSet);
  const startTimer = useRestTimer((t) => t.start);

  const { unit, effShowWeight } = useLogPrefs(exerciseKey, showWeight);

  const numSets = prescription?.sets ?? 3;
  const baseReps = prescription?.reps ?? 5;
  const targetRPE = prescription?.target_rpe ?? 8;

  // Last completed session for this exercise (set-level). During an active
  // session soccer_sets only holds PAST sessions, so [0] is genuinely last time.
  const { data: history } = useExerciseHistory(exerciseKey, 'sets');
  const lastTop = history?.[0] ? topSet(history[0].sets) : null;

  const calcRec = effShowWeight ? calcLoad(exerciseKey, prescription?.pct, maxes) : 0;
  const baseRec = recOverridePresent
    ? (recOverride ?? null)
    : (effShowWeight ? seedBaseRec({ calcRec, prescription, lastTop }) : 0);

  // Per-row state. Restored from the session buffer so a reload mid-workout
  // keeps the sets you already logged (the old table lost them on reload).
  const [rows, setRows] = useState(() => {
    const buffered = useSessionStore.getState().setsBuffer.filter((r) => r.exercise_key === exerciseKey);
    return Array.from({ length: numSets }, (_, i) => {
      const b = buffered.find((r) => r.set_num === i + 1);
      return b
        ? { reps: b.actual_reps, weight: b.actual_weight, rpe: b.rpe, done: true }
        : { reps: null, weight: null, rpe: targetRPE, done: false };
    });
  });
  const [adaptNote, setAdaptNote] = useState(null);
  const [openIdx, setOpenIdx] = useState(null);

  // The next-set recommendation accounting for prior completed sets.
  function recForSet(idx, rs = rows) {
    if (!effShowWeight) return null;
    if (baseRec == null || baseRec === 0) return null;
    const { rec } = computeNextRec({ baseRec, prescription, history: rs.slice(0, idx) });
    return rec;
  }

  // Best pre-fill for a set's sheet: what you already entered → today's rec
  // → the previous logged set → last session's top set.
  function initialFor(idx) {
    const row = rows[idx];
    const prev = [...rows.slice(0, idx)].reverse().find((r) => r.done);
    return {
      weight: effShowWeight
        ? (row.weight ?? recForSet(idx) ?? prev?.weight ?? lastTop?.weight ?? null)
        : null,
      reps: row.reps ?? prev?.reps ?? baseReps,
      rpe: row.done ? row.rpe : targetRPE,
    };
  }

  function logSet(idx, values) {
    const wasDone = rows[idx].done;
    const nextRows = rows.map((r, i) => (i === idx ? { ...r, ...values, done: true } : r));
    setRows(nextRows);
    setOpenIdx(null);

    const rec = recForSet(idx);
    pushSet({
      exercise_key: exerciseKey,
      exercise_name: exerciseName,
      set_num: idx + 1,
      actual_reps: values.reps ?? baseReps,
      unit,
      actual_weight: effShowWeight ? (values.weight ?? rec ?? 0) : null,
      rpe: values.rpe ?? targetRPE,
      rec_weight: rec,
      day_type: dayType,
      week_num: week,
      mode,
      phase,
      performed_at: new Date().toISOString(),
    });

    if (idx < nextRows.length - 1) {
      const nextRec = computeNextRec({ baseRec, prescription, history: nextRows.slice(0, idx + 1) });
      setAdaptNote(nextRec.note);
    }

    // Rest timer — only when a set is newly logged, not on an edit.
    if (!wasDone) startTimer({ exerciseName, context, week, rpe: values.rpe });
  }

  function resetSet(idx) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { reps: null, weight: null, rpe: targetRPE, done: false } : r)));
    removeSet(exerciseKey, idx + 1);
    setOpenIdx(null);
  }

  const currentIdx = rows.findIndex((r) => !r.done);
  const unitWord = unit === 'secs' ? 'sec' : 'reps';

  return (
    <>
      <div className={styles.list}>
        {rows.map((row, idx) => {
          const isCurrent = idx === currentIdx;
          const rec = recForSet(idx);
          const targetMain = effShowWeight
            ? (rec ? `${rec} lb` : 'Pick a weight')
            : `${baseReps} ${unitWord}`;
          const targetSub = `RPE ${targetRPE}`;
          return (
            <div key={idx} className={`${styles.row} ${row.done ? styles.rowDone : ''}`}>
              <div className={`${styles.num} ${isCurrent ? styles.numOn : ''}`}>{idx + 1}</div>
              <div className={styles.target}>
                <div className={styles.targetMain}>{targetMain}</div>
                {!row.done && <div className={styles.targetSub}>{targetSub}</div>}
              </div>
              {row.done ? (
                <button type="button" className={styles.logged} onClick={() => setOpenIdx(idx)} aria-label={`Edit set ${idx + 1}`}>
                  {effShowWeight && row.weight != null ? `${fmtNum(row.weight)}lb × ` : ''}
                  {fmtNum(row.reps)}{unit === 'secs' ? 's' : ''} @ {fmtNum(row.rpe)}
                  <span className={styles.chev}>›</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.plus} ${isCurrent ? styles.plusOn : ''}`}
                  onClick={() => setOpenIdx(idx)}
                  aria-label={`Log set ${idx + 1}`}
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>
      {adaptNote && <AdaptNote>{adaptNote}</AdaptNote>}

      {openIdx != null && (
        <LogSetSheet
          key={openIdx}
          open
          title={`${exerciseName} · Set ${openIdx + 1} of ${rows.length}`}
          initial={initialFor(openIdx)}
          showWeight={effShowWeight}
          unit={unit}
          logged={rows[openIdx].done}
          onDone={(v) => logSet(openIdx, v)}
          onReset={() => resetSet(openIdx)}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}
