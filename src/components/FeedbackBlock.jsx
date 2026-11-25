import { useState } from 'react';
import setStyles from './SetList.module.css';
import uiStyles from './ui/ui.module.css';
import { FullSheet, PillButton } from './ui/FullSheet';
import { Stepper } from './ui/Stepper';
import { BarScale } from './ui/BarScale';
import { RPE_WORDS } from '../lib/workoutFormat';
import { useSessionStore } from '../stores/sessionStore';

const QUALITY = [
  { value: 1, label: 'Rough',   desc: 'Mechanics fell apart' },
  { value: 2, label: 'Sloppy',  desc: 'A few good reps' },
  { value: 3, label: 'Solid',   desc: 'Mostly clean' },
  { value: 4, label: 'Sharp',   desc: 'Crisp and fast' },
  { value: 5, label: 'Perfect', desc: 'Best reps in a while' },
];

const EASE = [
  { value: 1, label: 'Max',      desc: 'All I had' },
  { value: 2, label: 'Hard',     desc: 'Tough but doable' },
  { value: 3, label: 'Target',   desc: 'Right where it should be' },
  { value: 4, label: 'Easy',     desc: 'Had more in the tank' },
  { value: 5, label: 'Too easy', desc: 'Could push this next time' },
];

// Per-exercise feedback for agility / plyo: one "How did it go?" row with a +
// button. The sheet captures quality, effort RPE, ease, the optional
// measurement (broad jump distance, box height…) and notes, and buffers it to
// soccer_exercise_perf (spec §11).
//
// Encoded notes format when structured fields exist:
//   "[upgrade · 42 in] freeform notes here"
// Order of prefixes: upgrade flag, measurement, then user text.
export function FeedbackBlock({
  exerciseKey,
  exerciseName,
  exerciseType,
  measure = null,       // { label, unit, min, max, step } or null
  isUpgrade = false,
}) {
  const dayType = useSessionStore((s) => s.dayType);
  const pushPerf = useSessionStore((s) => s.pushExercisePerf);
  const removePerf = useSessionStore((s) => s.removeExercisePerf);
  const logged = useSessionStore((s) => s.exercisePerfBuffer.find((r) => r.exercise_key === exerciseKey));

  const [open, setOpen] = useState(false);
  const [quality, setQuality] = useState(3);
  const [effort, setEffort] = useState(7);
  const [ease, setEase] = useState(3);
  const [measureVal, setMeasureVal] = useState(null);
  const [notes, setNotes] = useState('');

  const onDone = () => {
    const tags = [];
    if (isUpgrade) tags.push('upgrade');
    if (measure && measureVal != null && measureVal > 0) tags.push(`${measureVal} ${measure.unit}`);
    const prefix = tags.length > 0 ? `[${tags.join(' · ')}] ` : '';
    const composed = (prefix + notes).trim();

    pushPerf({
      exercise_key: exerciseKey,
      exercise_name: exerciseName,
      exercise_type: exerciseType,
      day_type: dayType,
      quality,
      effort_rpe: effort,
      ease,
      notes: composed,
      performed_at: new Date().toISOString(),
    });
    setOpen(false);
  };

  const onReset = () => {
    if (window.confirm('Clear the feedback logged for this exercise?')) {
      removePerf(exerciseKey);
      setOpen(false);
    }
  };

  const qLabel = QUALITY.find((q) => q.value === logged?.quality)?.label;
  const measureTag = logged?.notes?.match(/\[[^\]]*?(\d[\d.]*\s*\w+)[^\]]*\]/)?.[1];

  return (
    <>
      <div className={`${setStyles.row} ${logged ? setStyles.rowDone : ''}`}>
        <div className={`${setStyles.num} ${!logged ? setStyles.numOn : ''}`}>✓</div>
        <div className={setStyles.target}>
          <div className={setStyles.targetMain}>How did it go?</div>
          {!logged && <div className={setStyles.targetSub}>Quality · effort{measure ? ` · ${measure.label.toLowerCase()}` : ''}</div>}
        </div>
        {logged ? (
          <button type="button" className={setStyles.logged} onClick={() => setOpen(true)} aria-label="Edit feedback">
            {qLabel} · RPE {logged.effort_rpe}{measureTag ? ` · ${measureTag}` : ''}
            <span className={setStyles.chev}>›</span>
          </button>
        ) : (
          <button type="button" className={`${setStyles.plus} ${setStyles.plusOn}`} onClick={() => setOpen(true)} aria-label="Log feedback">
            +
          </button>
        )}
      </div>

      <FullSheet
        open={open}
        title="Performance"
        label={`${exerciseName} feedback`}
        onClose={() => setOpen(false)}
        headerActions={logged ? (
          <button type="button" className={uiStyles.iconBtn} onClick={onReset} aria-label="Reset feedback">↺</button>
        ) : null}
        footer={<PillButton onClick={onDone}>✓ DONE</PillButton>}
      >
        <div style={{ color: 'var(--t3)', fontSize: 16, margin: '4px 4px 12px' }}>{exerciseName}</div>
        {measure && (
          <Stepper
            label={measure.label}
            value={measureVal}
            onChange={setMeasureVal}
            step={measure.step ?? 1}
            min={0}
            max={measure.max ?? 999}
            decimal
            unit={measure.unit}
            placeholder={String(measure.min ?? '—')}
          />
        )}
        <BarScale question="How clean were the reps?" options={QUALITY} value={quality} onChange={setQuality} lowLabel="Rough" highLabel="Perfect" />
        <Stepper
          label="Effort (RPE)"
          value={effort}
          onChange={(v) => setEffort(v == null ? 7 : v)}
          step={0.5}
          min={5}
          max={10}
          decimal
          hint={RPE_WORDS[effort] ?? ' '}
        />
        <BarScale question="How did it feel vs. the target?" options={EASE} value={ease} onChange={setEase} lowLabel="Max" highLabel="Too easy" />
        <div className={uiStyles.card}>
          <div className={uiStyles.cardLabel}>Notes</div>
          <textarea
            className={uiStyles.textArea}
            placeholder="Anything worth remembering"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </FullSheet>
    </>
  );
}
