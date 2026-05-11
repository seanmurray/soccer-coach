import { useState } from 'react';
import styles from './Feedback.module.css';
import { useSessionStore } from '../stores/sessionStore';

const EASE_LABELS = {
  1: 'Max',
  2: 'Hard',
  3: 'Target',
  4: 'Easy',
  5: 'Too easy',
};

// Per-exercise feedback block for agility / plyo. Captures
// quality (1-5), effort_rpe (5-10), ease (1-5), optional measurement
// (broad jump distance, box height, etc.), and a freeform notes textarea.
// Buffers to soccer_exercise_perf on Save (spec §11).
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

  const [quality, setQuality] = useState(3);
  const [effort, setEffort] = useState(7);
  const [ease, setEase] = useState(3);
  const [measureVal, setMeasureVal] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const onSave = () => {
    // Compose the encoded notes string per spec §11.
    const tags = [];
    if (isUpgrade) tags.push('upgrade');
    if (measure && measureVal !== '' && Number(measureVal) > 0) {
      tags.push(`${measureVal} ${measure.unit}`);
    }
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
    setSaved(true);
  };

  const dirty = () => setSaved(false);

  return (
    <div className={styles.area}>
      <div className={styles.row}>
        <div className={styles.label}>Quality</div>
        <input type="range" min="1" max="5" step="1" value={quality} className={styles.range}
          onChange={(e) => { setQuality(Number(e.target.value)); dirty(); }} />
        <div className={styles.val}>{quality}/5</div>
      </div>
      <div className={styles.row}>
        <div className={styles.label}>Effort</div>
        <input type="range" min="5" max="10" step="0.5" value={effort} className={styles.range}
          onChange={(e) => { setEffort(Number(e.target.value)); dirty(); }} />
        <div className={styles.val}>RPE {effort}</div>
      </div>
      <div className={styles.row}>
        <div className={styles.label}>Ease</div>
        <input type="range" min="1" max="5" step="1" value={ease} className={styles.range}
          onChange={(e) => { setEase(Number(e.target.value)); dirty(); }} />
        <div className={styles.val}>{ease}/5</div>
      </div>
      <div className={styles.easeHint}>{ease} = {EASE_LABELS[ease]}</div>
      {measure && (
        <div className={styles.measureRow}>
          <div className={styles.label}>{measure.label}</div>
          <input
            type="number"
            inputMode="numeric"
            className={styles.measureInput}
            min={measure.min}
            max={measure.max}
            step={measure.step}
            placeholder={`${measure.min}-${measure.max}`}
            value={measureVal}
            onChange={(e) => { setMeasureVal(e.target.value); dirty(); }}
          />
          <div className={styles.measureUnit}>{measure.unit}</div>
        </div>
      )}
      <textarea
        className={styles.notes}
        placeholder="Notes (anything worth remembering)"
        value={notes}
        onChange={(e) => { setNotes(e.target.value); dirty(); }}
      />
      <div className={styles.saveRow}>
        <button
          type="button"
          className={`${styles.save} ${saved ? styles.saved : ''}`}
          onClick={onSave}
          disabled={saved}
        >
          {saved ? 'Logged ✓' : 'Log feedback'}
        </button>
      </div>
    </div>
  );
}
