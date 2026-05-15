import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styles from './HistoryScreen.module.css';
import sheetStyles from '../components/PostSessionSheet.module.css';
import { useSessions, useSessionDetail, useDeleteSession } from '../hooks/useSessions';
import { DAY_TYPE_INFO, MODE_DATA } from '../data/sessions';
import { getPhaseLabel } from '../lib/periodization';
import { useDebriefStore } from '../stores/debriefStore';
import { retryDebrief } from '../lib/debrief';
import { usePRTimeline } from '../hooks/usePRTimeline';
import { prsForSession } from '../lib/prs';
import { PRSummaryBadge, PRBadgeList } from '../components/PRBadge';

const DATE_FMT = { weekday: 'short', month: 'short', day: 'numeric' };

const formatDate = (iso) => {
  if (!iso) return '—';
  // performed_at is a date column → "YYYY-MM-DD". Building a Date from that
  // directly produces midnight UTC, which can shift a day in some timezones.
  // Construct the date manually so the displayed day matches what was logged.
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, DATE_FMT);
};

const modeBadgeClass = (mode) => {
  switch (mode) {
    case 'mod1':     return styles.badgeMod1;
    case 'mod2':     return styles.badgeMod2;
    case 'mod3':     return styles.badgeMod3;
    case 'recovery': return styles.badgeRecovery;
    case 'full':
    default:         return styles.badgeFull;
  }
};

export function HistoryScreen() {
  const { data: sessions, isLoading, error } = useSessions();
  const { data: prTimeline } = usePRTimeline();
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteMutation = useDeleteSession();

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      console.error('[history] delete failed', err);
    }
  };

  if (isLoading) {
    return (
      <main className="screen">
        <div className="title-xl" style={{ marginBottom: 20 }}>History</div>
        <div className={styles.loading}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="screen">
        <div className="title-xl" style={{ marginBottom: 20 }}>History</div>
        <div className={styles.error}>
          Couldn't load sessions: {error.message ?? String(error)}
        </div>
      </main>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <main className="screen">
        <div className="title-xl" style={{ marginBottom: 20 }}>History</div>
        <div className={styles.empty}>
          <strong>No sessions yet.</strong>
          <div style={{ marginTop: 8 }}>
            Finish a session from the Workout tab and it'll appear here.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="title-xl" style={{ marginBottom: 20 }}>History</div>
      {sessions.map((s) => (
        <SessionCard
          key={s.id}
          session={s}
          prTimeline={prTimeline}
          onRequestDelete={() => setPendingDelete(s)}
        />
      ))}
      <DeleteConfirmSheet
        session={pendingDelete}
        deleting={deleteMutation.isPending}
        error={deleteMutation.error}
        onCancel={() => setPendingDelete(null)}
        onConfirm={onConfirmDelete}
      />
    </main>
  );
}

function SessionCard({ session, prTimeline, onRequestDelete }) {
  const [expanded, setExpanded] = useState(false);
  const dayInfo = DAY_TYPE_INFO[session.day_type];
  const modeLabel = MODE_DATA[session.mode]?.label ?? session.mode ?? '—';
  const phase = session.metadata?.phase ?? (session.week_num ? getPhaseLabel(session.week_num) : null);
  const prs = prTimeline ? prsForSession(prTimeline, session.id) : [];

  return (
    <div className={styles.item}>
      <div
        role="button"
        tabIndex={0}
        className={styles.head}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((x) => !x); }
        }}
        aria-expanded={expanded}
      >
        <div className={styles.headLeft}>
          <div className={styles.date}>{formatDate(session.performed_at)}</div>
          <div className={styles.dayLine}>
            {dayInfo?.sub ?? session.day_type ?? '—'}
            {session.week_num ? ` · Wk${session.week_num}` : ''}
            {phase ? ` · ${phase}` : ''}
          </div>
        </div>
        <div className={styles.headRight}>
          <span className={`${styles.badge} ${modeBadgeClass(session.mode)}`}>{modeLabel}</span>
          <PRSummaryBadge count={prs.length} />
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>Recovery <strong>{session.recovery_pct ?? '—'}%</strong></div>
        <div className={styles.stat}>RPE <strong>{session.session_rpe ?? '—'}</strong></div>
        {session.battery_pct != null && <div className={styles.stat}>Batt <strong>{session.battery_pct}%</strong></div>}
        {session.stress_score != null && <div className={styles.stat}>Stress <strong>{session.stress_score}</strong></div>}
        {session.energy != null && <div className={styles.stat}>Energy <strong>{session.energy}/5</strong></div>}
      </div>

      {expanded && (
        <SessionDetail
          sessionId={session.id}
          session={session}
          prs={prs}
          onRequestDelete={onRequestDelete}
        />
      )}
    </div>
  );
}

function SessionDetail({ sessionId, session, prs = [], onRequestDelete }) {
  const { data, isLoading, error } = useSessionDetail(sessionId);

  if (isLoading) {
    return (
      <div className={styles.detail}>
        <div className={styles.loading}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.detail}>
        <div className={styles.error}>Couldn't load detail: {error.message ?? String(error)}</div>
      </div>
    );
  }

  const { sets = [], exercisePerf = [], moduleUsage = [] } = data ?? {};

  // Group sets by exercise_key for the per-exercise rollup.
  const grouped = sets.reduce((acc, set) => {
    const key = set.exercise_key;
    (acc[key] ??= { name: set.exercise_name, sets: [] }).sets.push(set);
    return acc;
  }, {});
  const exerciseKeys = Object.keys(grouped);

  if (
    exerciseKeys.length === 0 &&
    exercisePerf.length === 0 &&
    moduleUsage.length === 0 &&
    !session?.ai_debrief
  ) {
    return (
      <div className={styles.detail}>
        <div style={{ fontSize: 14, color: 'var(--t3)', padding: '12px 0' }}>
          No detail logged for this session.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      {prs.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Personal records</div>
          <PRBadgeList prs={prs} />
        </div>
      )}

      {exerciseKeys.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Sets</div>
          {exerciseKeys.map((key) => (
            <div key={key} className={styles.exerciseGroup}>
              <div className={styles.exerciseName}>{grouped[key].name}</div>
              {grouped[key].sets.map((s) => (
                <div key={s.id} className={styles.setLine}>
                  Set {s.set_num} — {s.actual_reps ?? '—'} reps
                  {s.actual_weight != null ? ` @ ${s.actual_weight} lbs` : ''}
                  {s.rpe != null ? ` · RPE ${s.rpe}` : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {exercisePerf.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Exercise feedback</div>
          {exercisePerf.map((p) => (
            <div key={p.id} className={styles.exerciseGroup}>
              <div className={styles.exerciseName}>{p.exercise_name}</div>
              <div className={styles.setLine}>
                {p.exercise_type} · Q {p.quality ?? '—'}/5 · RPE {p.effort_rpe ?? '—'} · Ease {p.ease ?? '—'}/5
              </div>
              {p.notes && <div className={styles.feedbackLine}>{p.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {moduleUsage.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Modules</div>
          {moduleUsage.map((m) => (
            <div key={m.id} className={styles.exerciseGroup}>
              <div className={styles.exerciseName}>{m.module_label}</div>
              <div className={styles.setLine}>
                {Math.round((m.duration_seconds ?? 0) / 60)} min ·{' '}
                {(m.exercises_done?.length ?? 0)}/{m.exercises_total ?? 0} done
              </div>
            </div>
          ))}
        </div>
      )}

      {session?.metadata?.tabs_visited?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Session shape</div>
          <div className={styles.setLine}>
            Tabs: {session.metadata.tabs_visited.join(' · ')}
          </div>
          {session.metadata.warmup_total > 0 && (
            <div className={styles.setLine}>
              Warmup: {session.metadata.warmup_checked_count}/{session.metadata.warmup_total}
            </div>
          )}
          {session.metadata.frc_short_total > 0 && (
            <div className={styles.setLine}>
              FRC pre-session: {session.metadata.frc_short_checked_count}/{session.metadata.frc_short_total}
            </div>
          )}
          {session.metadata.frc_full_total > 0 && (
            <div className={styles.setLine}>
              FRC post-conditioning: {session.metadata.frc_full_checked_count}/{session.metadata.frc_full_total}
            </div>
          )}
        </div>
      )}

      <DebriefSection session={session} />

      {onRequestDelete && (
        <div className={styles.dangerZone}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onRequestDelete}
          >
            Delete this session
          </button>
        </div>
      )}
    </div>
  );
}

// Bottom-sheet confirmation for destructive delete. Reuses PostSessionSheet
// styles for visual consistency; CTA is destructive (red) instead of green.
function DeleteConfirmSheet({ session, deleting, error, onCancel, onConfirm }) {
  const open = !!session;
  const dateLabel = session ? formatDate(session.performed_at) : '';
  const dayLabel = session ? (DAY_TYPE_INFO[session.day_type]?.sub ?? session.day_type ?? '') : '';

  return (
    <>
      <div
        className={`${sheetStyles.overlay} ${open ? sheetStyles.open : ''}`}
        onClick={() => !deleting && onCancel?.()}
        aria-hidden
      />
      <div
        className={`${sheetStyles.sheet} ${open ? sheetStyles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Delete session"
      >
        <div className={sheetStyles.handle} />
        <div className={sheetStyles.header}>
          <div className={sheetStyles.title}>Delete session?</div>
          <div className={sheetStyles.sub}>{dateLabel} · {dayLabel}</div>
        </div>
        <div className={sheetStyles.body}>
          <div style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 4 }}>
            This permanently removes the session, all logged sets, exercise feedback, and module usage. It cannot be undone.
          </div>
          {error && (
            <div className={styles.error} style={{ marginTop: 12 }}>
              Delete failed: {error.message ?? String(error)}
            </div>
          )}
          <div className={sheetStyles.actions}>
            <button
              type="button"
              className={sheetStyles.secondary}
              onClick={onCancel}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${sheetStyles.cta} ${styles.ctaDestructive}`}
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Debrief section — shows the saved text if present, the in-flight spinner
// if the request is pending, or the last error + a Retry button if it failed.
// Older sessions with no debrief and no recent attempt show a one-tap
// Generate button so we can backfill them.
function DebriefSection({ session }) {
  const queryClient = useQueryClient();
  const isPending = useDebriefStore((s) => s.pending.has(session?.id));
  const error = useDebriefStore((s) => s.errors[session?.id] ?? null);

  if (session?.ai_debrief) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>AI debrief</div>
        <div style={{ fontSize: 16, color: 'var(--t2)', lineHeight: 1.6, fontStyle: 'italic' }}>
          {session.ai_debrief}
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>AI debrief</div>
        <div style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.5 }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
          <span style={{ marginLeft: 8 }}>Generating…</span>
        </div>
      </div>
    );
  }

  const onRetry = () => {
    console.log('[history] Generate/Retry clicked for', session?.id);
    retryDebrief({ session, queryClient });
  };

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>AI debrief</div>
        <div style={{
          fontSize: 14, color: 'var(--red)', lineHeight: 1.5,
          background: 'var(--red-bg)', border: '0.5px solid rgba(255,69,58,0.25)',
          borderRadius: 'var(--r2)', padding: '10px 12px', marginBottom: 8,
        }}>
          {error}
        </div>
        <button type="button" onClick={onRetry} style={retryBtn}>Retry</button>
      </div>
    );
  }

  // No debrief, no in-flight, no error — offer a Generate action.
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>AI debrief</div>
      <button type="button" onClick={onRetry} style={retryBtn}>Generate debrief</button>
    </div>
  );
}

const retryBtn = {
  height: 40,
  padding: '0 18px',
  borderRadius: 100,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'var(--green-bg)',
  color: 'var(--green)',
  border: '0.5px solid var(--green-line)',
};

