import { useState } from 'react';
import styles from './FinishSheet.module.css';

const FEELS = [
  { value: 1, emoji: '😅', label: 'Tough' },
  { value: 2, emoji: '💪', label: 'Good' },
  { value: 3, emoji: '🔥', label: 'Great' },
];

export function FinishSheet({ open, saving, onCancel, onConfirm }) {
  const [feel, setFeel] = useState(2);
  const [note, setNote] = useState('');

  if (!open) return null;

  return (
    <div className={styles.scrim} onClick={onCancel}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>Nice work! 🎉</div>
        <div className={styles.sub}>How did today feel?</div>

        <div className={styles.feelRow}>
          {FEELS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.feel} ${feel === f.value ? styles.on : ''}`}
              onClick={() => setFeel(f.value)}
            >
              <span className={styles.feelEmoji}>{f.emoji}</span>
              <span className={styles.feelLabel}>{f.label}</span>
            </button>
          ))}
        </div>

        <textarea
          className={styles.note}
          rows={2}
          placeholder="Anything to remember? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={saving}>
            Back
          </button>
          <button
            type="button"
            className={styles.save}
            onClick={() => onConfirm({ feel, note })}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
