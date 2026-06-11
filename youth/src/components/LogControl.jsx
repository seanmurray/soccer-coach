import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styles from './LogControl.module.css';
import { useYouthPRs } from '../hooks/useYouthPRs';
import { saveYouthPR, bestForKey, lastForKey, formatLog } from '../lib/prs';

// Inline log control shown inside the expanded ExerciseCard whenever the
// exercise carries a `log` definition. Always visible:
//   • LAST — most-recent value (so he sees what to beat)
//   • PR   — best value ever
// Tap "Log result" → number input → Save. If the new value beats his prior
// best, the cell celebrates with a NEW RECORD animation; otherwise it's just
// quietly added to history (still a useful data point — last value updates).
export function LogControl({ exercise }) {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useYouthPRs();
  const log = exercise.log ?? exercise.pr; // legacy alias

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // 'record' | 'logged'

  const best = bestForKey(rows, exercise.key, log.higherIsBetter);
  const last = lastForKey(rows, exercise.key);

  const placeholder =
    log.unit === 'sec'  ? 'seconds' :
    log.unit === 'reps' ? 'reps' :
    log.unit === 'lb'   ? 'pounds' :
    log.unit === 'in'   ? 'inches' :
    log.unit;

  const submit = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return;
    setSaving(true);
    const result = await saveYouthPR({ exerciseKey: exercise.key, value: num, unit: log.unit });
    setSaving(false);
    if (!result.ok) {
      alert('Could not save: ' + (result.error?.message ?? 'unknown error'));
      return;
    }
    const isRecord = best == null || (log.higherIsBetter ? num > best : num < best);
    setCelebrate(isRecord ? 'record' : 'logged');
    setEditing(false);
    setValue('');
    queryClient.invalidateQueries({ queryKey: ['youth_prs'] });
    setTimeout(() => setCelebrate(null), 2600);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>🏅 {log.label}</div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Last</div>
          {last != null
            ? <div className={styles.statValue}>{formatLog(last, log)}</div>
            : <div className={styles.statNone}>—</div>}
        </div>
        <div className={`${styles.stat} ${styles.statPr}`}>
          <div className={styles.statLabel}>PR</div>
          {best != null
            ? <div className={styles.statValue}>{formatLog(best, log)}</div>
            : <div className={styles.statNone}>—</div>}
        </div>
      </div>

      {!editing && !celebrate && (
        <button type="button" className={styles.logBtn} onClick={() => setEditing(true)}>
          {last == null ? `Log your first ${log.label.toLowerCase()}` : 'Log today\'s result'}
        </button>
      )}

      {editing && (
        <div className={styles.form}>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              autoFocus
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <span className={styles.unit}>{log.unit}</span>
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
