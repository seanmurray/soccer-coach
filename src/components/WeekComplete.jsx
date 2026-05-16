import { useState } from 'react';
import styles from './WeekComplete.module.css';
import sheet from './PostSessionSheet.module.css';
import { useSessionStore } from '../stores/sessionStore';
import { getPhaseLabel } from '../lib/periodization';
import { DAY_TYPE_INFO } from '../data/sessions';
import { useWeekStatus, useCompleteWeek, useWeekCompletions, REQUIRED_DAYS } from '../hooks/useWeek';

const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Today-screen card: shows the current week, phase, required-day progress
// (acc/lat/lin/vel; conditioning optional), and a Complete Week button.
// The button opens a rating sheet; completion is HARD-BLOCKED until all
// four required days have a logged session for this week.
export function WeekComplete() {
  const week = useSessionStore((s) => s.week);
  const setWeek = useSessionStore((s) => s.setWeek);
  const { data: status } = useWeekStatus(week);
  const [open, setOpen] = useState(false);

  const phase = getPhaseLabel(week);

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.title}>Week {week}</div>
        <div className={styles.phase}>{phase}</div>
      </div>

      <div className={styles.days}>
        {REQUIRED_DAYS.map((d) => (
          <div
            key={d}
            className={`${styles.day} ${status?.requiredDone?.[d] ? styles.dayDone : ''}`}
          >
            {DAY_TYPE_INFO[d]?.sub ?? d}
          </div>
        ))}
        <div className={`${styles.day} ${styles.dayCond} ${status?.condDone ? styles.dayDone : ''}`}>
          Cond·opt
        </div>
      </div>

      <button type="button" className={styles.completeBtn} onClick={() => setOpen(true)}>
        Complete Week {week} →
      </button>

      <CompleteWeekSheet
        open={open}
        week={week}
        phase={phase}
        status={status}
        onClose={() => setOpen(false)}
        onCompleted={() => {
          setOpen(false);
          setWeek(week + 1);
        }}
      />
    </div>
  );
}

// History-screen "Week log" — past completed weeks, newest first. Renders
// nothing until at least one week has been completed.
export function WeekLog() {
  const { data: weeks } = useWeekCompletions();
  if (!weeks || weeks.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div className={styles.sectionLabel} style={{ margin: '0 0 10px' }}>Week log</div>
      {weeks.map((w) => (
        <div key={w.week_num} className={styles.card} style={{ marginBottom: 10 }}>
          <div className={styles.head} style={{ marginBottom: 8 }}>
            <div className={styles.title}>Week {w.week_num}</div>
            <div className={styles.phase}>{w.phase ?? ''}</div>
          </div>
          <div className={styles.rpePreview} style={{ marginTop: 0 }}>
            <span>Energy <strong>{w.rating_energy ?? '—'}/5</strong></span>
            <span>Progress <strong>{w.rating_progress ?? '—'}/5</strong></span>
            <span>Adherence <strong>{w.rating_adherence ?? '—'}/5</strong></span>
          </div>
          <div className={styles.rpePreview}>
            <span>Upper RPE <strong>{w.avg_upper_rpe ?? '—'}</strong></span>
            <span>Lower RPE <strong>{w.avg_lower_rpe ?? '—'}</strong></span>
          </div>
          {w.note && (
            <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.5, marginTop: 8 }}>
              {w.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Dial({ label, value, onChange }) {
  return (
    <div className={sheet.row}>
      <div className={sheet.label}>{label}</div>
      <input
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        className={sheet.range}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className={sheet.val}>{value}/5</div>
    </div>
  );
}

function CompleteWeekSheet({ open, week, phase, status, onClose, onCompleted }) {
  const [energy, setEnergy] = useState(3);
  const [progress, setProgress] = useState(3);
  const [adherence, setAdherence] = useState(3);
  const [note, setNote] = useState('');
  const mutation = useCompleteWeek();

  // Reset dials each time the sheet opens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setEnergy(3); setProgress(3); setAdherence(3); setNote('');
      mutation.reset();
    }
  }

  const missing = status?.missing ?? REQUIRED_DAYS;
  const allDone = status?.allDone ?? false;
  const saving = mutation.isPending;

  const onConfirm = async () => {
    if (!allDone || saving) return;
    try {
      await mutation.mutateAsync({
        week_num: week,
        completed_at: todayStr(),
        phase,
        rating_energy: energy,
        rating_progress: progress,
        rating_adherence: adherence,
        note: note.trim() || null,
        avg_upper_rpe: status?.avgUpperRpe ?? null,
        avg_lower_rpe: status?.avgLowerRpe ?? null,
      });
      onCompleted();
    } catch (err) {
      console.error('[week] complete failed', err);
    }
  };

  const fmtRpe = (v) => (v == null ? '—' : v);

  return (
    <>
      <div
        className={`${sheet.overlay} ${open ? sheet.open : ''}`}
        onClick={() => !saving && onClose?.()}
        aria-hidden
      />
      <div
        className={`${sheet.sheet} ${open ? sheet.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Complete week"
      >
        <div className={sheet.handle} />
        <div className={sheet.header}>
          <div className={sheet.title}>Complete Week {week}</div>
          <div className={sheet.sub}>{phase} · how did it go</div>
        </div>
        <div className={sheet.body}>
          <div className={styles.sectionLabel}>Required days</div>
          <div className={styles.checklist}>
            {REQUIRED_DAYS.map((d) => {
              const done = status?.requiredDone?.[d];
              return (
                <div
                  key={d}
                  className={`${styles.checkRow} ${done ? styles.checkDone : styles.checkMissing}`}
                >
                  <span>{DAY_TYPE_INFO[d]?.sub ?? d}</span>
                  <span>{done ? 'Logged ✓' : 'Missing'}</span>
                </div>
              );
            })}
          </div>
          {!allDone && (
            <div className={styles.blockNote}>
              Conditioning is optional, but all four of the above must be logged
              for Week {week} before it can be completed.
            </div>
          )}

          <div className={styles.sectionLabel}>How the week went</div>
          <Dial label="Energy" value={energy} onChange={setEnergy} />
          <Dial label="Progress" value={progress} onChange={setProgress} />
          <Dial label="Adherence" value={adherence} onChange={setAdherence} />

          <div className={styles.sectionLabel}>Auto-tracked strength load</div>
          <div className={styles.rpePreview}>
            <span>Upper RPE <strong>{fmtRpe(status?.avgUpperRpe)}</strong></span>
            <span>Lower RPE <strong>{fmtRpe(status?.avgLowerRpe)}</strong></span>
          </div>

          <div className={styles.sectionLabel}>Note (optional)</div>
          <textarea
            className={styles.note}
            placeholder="Anything notable about the week — niggles, wins, life stress…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {mutation.isError && (
            <div className={styles.blockNote}>
              {mutation.error?.message ?? 'Failed to save week.'}
            </div>
          )}

          <div className={sheet.actions}>
            <button type="button" className={sheet.secondary} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className={sheet.cta}
              onClick={onConfirm}
              disabled={!allDone || saving}
            >
              {saving ? 'Saving…' : allDone ? `Complete & advance →` : `${missing.length} day${missing.length === 1 ? '' : 's'} left`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
