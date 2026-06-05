import styles from './HistoryScreen.module.css';
import { useYouthSessions } from '../hooks/useYouthSessions';
import { CONTEXTS } from '../data/templates';
import { summarize } from '../lib/streak';

const FEEL_EMOJI = { 1: '😅', 2: '💪', 3: '🔥' };

function formatDay(d) {
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function HistoryScreen() {
  const { data: sessions, isLoading, error } = useYouthSessions();

  if (isLoading) {
    return (
      <main className="screen">
        <div className={styles.header}>
          <div className="overline">Keep the streak</div>
          <div className="title-xl">STREAK</div>
        </div>
        <div className={styles.loading}>Loading…</div>
      </main>
    );
  }

  const rows = sessions ?? [];
  const { streak, total, thisWeek } = summarize(rows);

  return (
    <main className="screen">
      <div className={styles.header}>
        <div className="overline">Keep the streak</div>
        <div className="title-xl">STREAK</div>
      </div>

      <div className={styles.statRow}>
        <div className={styles.stat}>
          <div className={`${styles.statBig} ${styles.flame}`}>{streak}{streak > 0 ? '🔥' : ''}</div>
          <div className={styles.statLabel}>Day streak</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statBig}>{thisWeek}</div>
          <div className={styles.statLabel}>This week</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statBig}>{total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
      </div>

      {error && (
        <div className={styles.empty}>
          <div className={styles.emptyText}>Couldn't load your history: {error.message}</div>
        </div>
      )}

      {!error && rows.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>💪</div>
          <div className={styles.emptyText}>
            No workouts yet.<br />Head to Today and start your first one!
          </div>
        </div>
      )}

      {rows.map((s) => (
        <div key={s.id} className={styles.sessionCard}>
          <span className={styles.sessionEmoji}>{CONTEXTS[s.context]?.emoji ?? '🏃'}</span>
          <div className={styles.sessionMid}>
            <div className={styles.sessionTitle}>{s.title}</div>
            <div className={styles.sessionMeta}>
              {formatDay(s.performed_at)} · {s.completed}/{s.total} moves
            </div>
          </div>
          {s.feel && <span className={styles.sessionFeel}>{FEEL_EMOJI[s.feel]}</span>}
        </div>
      ))}
    </main>
  );
}
