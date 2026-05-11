import { useState } from 'react';
import styles from './MaxSuggestion.module.css';
import { useMaxSuggestions } from '../hooks/useMaxSuggestions';
import { useSettingsStore } from '../stores/settingsStore';
import { MAXES_CONFIG } from '../data/exercises';

const labelForMaxKey = (key) => MAXES_CONFIG.find((m) => m.key === key)?.label ?? key;

export function MaxSuggestion() {
  const { data: suggestions } = useMaxSuggestions();
  const setMax = useSettingsStore((s) => s.setMax);
  const [dismissed, setDismissed] = useState(() => new Set());

  const visible = (suggestions ?? []).filter((s) => !dismissed.has(s.maxKey));
  if (visible.length === 0) return null;

  const dismiss = (key) => setDismissed((prev) => {
    const next = new Set(prev);
    next.add(key);
    return next;
  });

  const accept = (sug) => {
    setMax(sug.maxKey, sug.suggestedMax);
    // Dismiss the card too — once accepted there's nothing to show.
    dismiss(sug.maxKey);
  };

  return (
    <div className={styles.card}>
      <div className={styles.label}>Max progression</div>
      {visible.map((s) => (
        <div key={s.maxKey} className={styles.row}>
          <div className={styles.text}>
            <strong>{labelForMaxKey(s.maxKey)}</strong> — recent sets suggest{' '}
            <span className="mono">{s.e1RM} lbs</span> 1RM
            <br />
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>
              Stored: {s.currentMax} → Suggested: <span className={styles.delta}>{s.suggestedMax} lbs</span> · {s.sampleSize} sets across {s.sessionsCount} sessions
            </span>
          </div>
          <div className={styles.actions}>
            <button type="button" className={`${styles.btn} ${styles.dismiss}`} onClick={() => dismiss(s.maxKey)}>
              Skip
            </button>
            <button type="button" className={styles.btn} onClick={() => accept(s)}>
              Update
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
