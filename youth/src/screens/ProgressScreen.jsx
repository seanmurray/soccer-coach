import { useState } from 'react';
import styles from './ProgressScreen.module.css';
import { useYouthSessions } from '../hooks/useYouthSessions';
import { useYouthPRs } from '../hooks/useYouthPRs';
import { CONTEXTS } from '../data/templates';
import { EXERCISES } from '../data/exercises';
import { summarize, readWeeklyGoal, writeWeeklyGoal } from '../lib/streak';
import { computeXp, levelForXp } from '../lib/xp';
import { computeBadges } from '../lib/badges';
import { bestMap, lastMap, formatLog } from '../lib/prs';
import { WeeklyRing } from '../components/WeeklyRing';

const FEEL_EMOJI = { 1: '😅', 2: '💪', 3: '🔥' };
// Every exercise that can be logged at all — we show Last + PR for each one
// that has at least one logged attempt. Falls back to `.pr` to stay
// compatible with any older entry that still uses the prior field name.
const LOGGABLE = EXERCISES.filter((e) => e.log || e.pr);

function formatDay(d) {
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ProgressScreen() {
  const { data: sessions, isLoading } = useYouthSessions();
  const { data: prs = [] } = useYouthPRs();
  const [goal, setGoal] = useState(readWeeklyGoal);

  if (isLoading) {
    return (
      <main className="screen">
        <div className={styles.header}>
          <div className="overline">Your progress</div>
          <div className="title-xl">PROGRESS</div>
        </div>
        <div className={styles.loading}>Loading…</div>
      </main>
    );
  }

  const rows = sessions ?? [];
  const { streak, total, thisWeek } = summarize(rows);
  const xp = computeXp(rows, prs);
  const lvl = levelForXp(xp);
  const badges = computeBadges(rows, prs, streak);
  const earnedCount = badges.filter((b) => b.earned).length;
  const exerciseLookup = Object.fromEntries(EXERCISES.map((e) => [e.key, e]));
  const best = bestMap(prs, exerciseLookup);
  const last = lastMap(prs);
  // Show every loggable exercise that has at least one attempt, sorted by
  // most-recent-first so the kid's recent work is at the top.
  const records = LOGGABLE
    .filter((e) => best[e.key] != null)
    .map((e) => {
      const newest = prs.find((r) => r.exercise_key === e.key);
      return { ex: e, newestAt: newest?.achieved_at ?? '' };
    })
    .sort((a, b) => b.newestAt.localeCompare(a.newestAt));

  const changeGoal = (delta) => setGoal((g) => writeWeeklyGoal(g + delta));

  return (
    <main className="screen">
      <div className={styles.header}>
        <div className="overline">Your progress</div>
        <div className="title-xl">PROGRESS</div>
      </div>

      {/* Level hero */}
      <div className={styles.levelCard}>
        <div className={styles.levelTop}>
          <div className={styles.levelBadge}>{lvl.level}</div>
          <div>
            <div className={styles.levelName}>{lvl.name}</div>
            <div className={styles.levelSub}>{xp.toLocaleString()} XP total</div>
          </div>
        </div>
        <div className={styles.xpBar}>
          <div className={styles.xpFill} style={{ width: `${lvl.pct}%` }} />
        </div>
        <div className={styles.xpMeta}>
          {lvl.isMax
            ? <span>Max level — you're a Legend! 👑</span>
            : <>
                <span>{lvl.into} / {lvl.span} XP</span>
                <span>{lvl.toNext} XP to {lvl.next.name}</span>
              </>}
        </div>
      </div>

      {/* Weekly ring + streak */}
      <div className={styles.ringRow}>
        <WeeklyRing value={thisWeek} goal={goal} />
        <div className={styles.ringSide}>
          <div className={styles.streakBig}>{streak}{streak > 0 ? '🔥' : ''}</div>
          <div className={styles.streakLabel}>Day streak</div>
          <div className={styles.totalLine}>{total} total workout{total === 1 ? '' : 's'}</div>
          <div className={styles.goalStepper}>
            <span className={styles.goalLabel}>Weekly goal</span>
            <button type="button" className={styles.stepBtn} onClick={() => changeGoal(-1)} aria-label="Lower goal">−</button>
            <span className={styles.goalVal}>{goal} days</span>
            <button type="button" className={styles.stepBtn} onClick={() => changeGoal(1)} aria-label="Raise goal">+</button>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className={styles.sectionTitle}>Badges · {earnedCount}/{badges.length}</div>
      <div className={styles.badgeGrid}>
        {badges.map((b) => (
          <div key={b.id} className={`${styles.badge} ${b.earned ? styles.earned : ''}`}>
            <div className={styles.badgeEmoji}>{b.emoji}</div>
            <div className={styles.badgeLabel}>{b.label}</div>
            {!b.earned && <div className={styles.badgeProg}>{b.current}/{b.target}</div>}
          </div>
        ))}
      </div>

      {/* Records — every logged exercise with Last + PR side by side. */}
      <div className={styles.sectionTitle}>Records 🏅</div>
      {records.length === 0 ? (
        <div className={styles.hint}>
          No records yet. Inside any workout, expand an exercise card and tap “Log today's result” — your last value and PR will show up here.
        </div>
      ) : (
        records.map(({ ex }) => {
          const spec = ex.log ?? ex.pr;
          return (
            <div key={ex.key} className={styles.recordRow}>
              <span className={styles.recordMedal}>🏅</span>
              <span className={styles.recordName}>{ex.name}</span>
              <span className={styles.recordLast}>{formatLog(last[ex.key], spec)}</span>
              <span className={styles.recordVal}>{formatLog(best[ex.key], spec)}</span>
            </div>
          );
        })
      )}

      {/* History */}
      <div className={styles.sectionTitle}>History</div>
      {rows.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyEmoji}>💪</div>
          <div className={styles.emptyText}>No workouts yet.<br />Head to Today and start your first one!</div>
        </div>
      ) : (
        rows.map((s) => (
          <div key={s.id} className={styles.sessionCard}>
            <span className={styles.sessionEmoji}>{CONTEXTS[s.context]?.emoji ?? '🏃'}</span>
            <div className={styles.sessionMid}>
              <div className={styles.sessionTitle}>{s.title}</div>
              <div className={styles.sessionMeta}>{formatDay(s.performed_at)} · {s.completed}/{s.total} moves</div>
            </div>
            {s.feel && <span className={styles.sessionFeel}>{FEEL_EMOJI[s.feel]}</span>}
          </div>
        ))
      )}
    </main>
  );
}
