import { useState } from 'react';
import styles from './ExerciseCard.module.css';
import { PATTERNS, EQUIPMENT } from '../data/exercises';

// One exercise. Always shows name + prescription + a prominent "Watch" button
// (video is the key teaching tool for a beginner). Tap the card to expand the
// coaching cues. When `onToggle` is provided (Today's session) a big round
// Done check appears; in the Library it's omitted (reference only).
export function ExerciseCard({ exercise, done = false, onToggle, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const pat = PATTERNS[exercise.pattern];
  const color = pat?.color;

  return (
    <div
      className={`${styles.card} ${done ? styles.done : ''}`}
      style={{ '--c': color }}
    >
      <div className={styles.head}>
        <div
          className={styles.headText}
          role="button"
          tabIndex={0}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}
        >
          <div className={styles.name}>{exercise.name}</div>
          <div className={styles.rx}>{exercise.rx}</div>
          <div className={styles.meta}>
            <span className={styles.chip}>{pat?.emoji} {pat?.short}</span>
            <span className={styles.chip}>{EQUIPMENT[exercise.equipment]}</span>
          </div>
        </div>

        {onToggle && (
          <button
            type="button"
            className={`${styles.doneBtn} ${done ? styles.on : ''}`}
            aria-pressed={done}
            aria-label={done ? 'Mark not done' : 'Mark done'}
            onClick={() => onToggle(exercise.key)}
          >
            ✓
          </button>
        )}
      </div>

      <div className={styles.actions}>
        <a
          className={styles.watch}
          href={exercise.video}
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ Watch
        </a>
        <button
          type="button"
          className={styles.expandBtn}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide tips' : 'How to do it'}
        </button>
      </div>

      {open && (
        <div className={styles.details}>
          {exercise.why && <div className={styles.why}>💡 {exercise.why}</div>}
          <div className={styles.cuesLabel}>Coaching cues</div>
          {exercise.cues.map((c, i) => (
            <div key={i} className={styles.cue}>
              <span className={styles.cueNum}>{i + 1}</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
