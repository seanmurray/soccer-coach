import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styles from './PrControl.module.css';
import { useYouthPRs } from '../hooks/useYouthPRs';
import { saveYouthPR, bestForKey, formatPr } from '../lib/prs';

// Self-contained personal-record control shown inside an ExerciseCard when the
// exercise has `pr` metadata. Reads the current best from the cached PR query,
// lets the athlete log a new attempt, and celebrates when it's a new record.
export function PrControl({ exercise }) {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useYouthPRs();
  const pr = exercise.pr;

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // 'record' | 'logged'

  const best = bestForKey(rows, exercise.key, pr.higherIsBetter);

  const submit = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return;
    setSaving(true);
    const result = await saveYouthPR({ exerciseKey: exercise.key, value: num, unit: pr.unit });
    setSaving(false);
    if (!result.ok) {
      alert('Could not save: ' + (result.error?.message ?? 'unknown error'));
      return;
    }
    const isRecord = best == null || (pr.higherIsBetter ? num > best : num < best);
    setCelebrate(isRecord ? 'record' : 'logged');
    setEditing(false);
    setValue('');
    queryClient.invalidateQueries({ queryKey: ['youth_prs'] });
    setTimeout(() => setCelebrate(null), 2600);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        <span className={styles.medal}>🏅</span>
        <span className={styles.label}>{pr.label}</span>
        {best != null
          ? <span className={styles.best}>{formatPr(best, pr)}</span>
          : <span className={styles.none}>No record yet</span>}
      </div>

      {!editing && !celebrate && (
        <button type="button" className={styles.logBtn} onClick={() => setEditing(true)}>
          {best != null ? 'Beat your record' : 'Set your first record'}
        </button>
      )}

      {editing && (
        <div className={styles.form}>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              min="0"
              autoFocus
              placeholder={pr.unit === 'sec' ? 'seconds' : pr.unit === 'reps' ? 'reps' : pr.unit}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <span className={styles.unit}>{pr.unit}</span>
          </div>
          <div className={styles.btns}>
            <button type="button" className={styles.cancel} onClick={() => { setEditing(false); setValue(''); }}>
              Cancel
            </button>
            <button type="button" className={styles.save} onClick={submit} disabled={saving || !value}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {celebrate === 'record' && <div className={styles.celebrate}>🎉 NEW RECORD! 🎉</div>}
      {celebrate === 'logged' && <div className={styles.celebrate}>Logged! Keep pushing 💪</div>}
    </div>
  );
}
