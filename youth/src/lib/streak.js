// Streak + weekly-goal stats from youth_sessions rows.
//
// Forgiving streak ("streak freeze"): a single rest day never breaks the run —
// only two rest days in a row do. So the streak counts training days where
// each consecutive pair is at most 2 calendar days apart, and the run is still
// "alive" as long as the last workout was within the past 2 days. This keeps
// the streak a friend, not a tyrant, for a kid with a busy day.

const DAY = 24 * 60 * 60 * 1000;

function localMidnight(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function daysBetween(a, b) {
  return Math.round((localMidnight(a) - localMidnight(b)) / DAY);
}

// Unique training days (local midnights), newest first.
function trainingDays(sessions) {
  const set = new Map();
  for (const s of sessions) {
    const m = localMidnight(s.performed_at);
    set.set(m.getTime(), m);
  }
  return [...set.values()].sort((a, b) => b - a);
}

export function summarize(sessions) {
  const days = trainingDays(sessions);
  return {
    streak: currentStreak(days),
    total: sessions.length,
    thisWeek: countThisWeek(days),
  };
}

function currentStreak(days) {
  if (days.length === 0) return 0;
  const today = localMidnight(new Date());
  // Alive only if the most recent workout was today or within one rest day.
  if (daysBetween(today, days[0]) > 2) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (daysBetween(days[i - 1], days[i]) <= 2) streak += 1;
    else break;
  }
  return streak;
}

function countThisWeek(days) {
  const today = localMidnight(new Date());
  return days.filter((d) => daysBetween(today, d) <= 6).length; // today + previous 6
}

// ── Weekly goal (training days/week) — a small adjustable setting ──────────
const GOAL_KEY = 'ya-weekly-goal';
export const DEFAULT_WEEKLY_GOAL = 3;

export function readWeeklyGoal() {
  try {
    const v = Number(localStorage.getItem(GOAL_KEY));
    return Number.isFinite(v) && v >= 1 && v <= 7 ? v : DEFAULT_WEEKLY_GOAL;
  } catch {
    return DEFAULT_WEEKLY_GOAL;
  }
}
export function writeWeeklyGoal(n) {
  const v = Math.max(1, Math.min(7, n));
  try { localStorage.setItem(GOAL_KEY, String(v)); } catch { /* ignore */ }
  return v;
}
