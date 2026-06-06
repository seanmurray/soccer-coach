// Achievements, all derived from saved history (sessions + PRs + the streak).
// Each badge reports earned + current/target so the UI can show progress on
// the ones not yet unlocked ("8 / 10").

import { EXERCISE_BY_KEY, PATTERNS } from '../data/exercises';

export function deriveStats(sessions = [], prs = [], streak = 0) {
  const total = sessions.length;
  const homeCount = sessions.filter((s) => s.context === 'home').length;
  const gymCount = sessions.filter((s) => s.context === 'gym').length;

  // Completed moves tallied by movement pattern.
  const byPattern = {};
  for (const s of sessions) {
    for (const it of s.items ?? []) {
      if (!it.done) continue;
      const pat = it.pattern ?? EXERCISE_BY_KEY[it.key]?.pattern;
      if (pat) byPattern[pat] = (byPattern[pat] ?? 0) + 1;
    }
  }
  const patternsCovered = Object.keys(PATTERNS).filter((p) => (byPattern[p] ?? 0) > 0).length;
  const totalPatterns = Object.keys(PATTERNS).length;

  return { total, homeCount, gymCount, byPattern, patternsCovered, totalPatterns, prCount: prs.length, streak };
}

export function computeBadges(sessions = [], prs = [], streak = 0) {
  const st = deriveStats(sessions, prs, streak);

  const defs = [
    { id: 'first',       emoji: '🎯', label: 'First Workout', desc: 'Finish your first session', current: st.total, target: 1 },
    { id: 'w10',         emoji: '🔟', label: '10 Workouts',   desc: 'Finish 10 sessions',        current: st.total, target: 10 },
    { id: 'w25',         emoji: '🏅', label: '25 Workouts',   desc: 'Finish 25 sessions',        current: st.total, target: 25 },
    { id: 'w50',         emoji: '🎖️', label: '50 Workouts',   desc: 'Finish 50 sessions',        current: st.total, target: 50 },
    { id: 'streak3',     emoji: '🔥', label: '3-Day Streak',  desc: 'Train 3 days in a row',     current: st.streak, target: 3 },
    { id: 'streak7',     emoji: '🔥', label: 'Week Streak',   desc: 'Train 7 days in a row',     current: st.streak, target: 7 },
    { id: 'streak30',    emoji: '🌋', label: '30-Day Streak', desc: 'Train 30 days in a row',    current: st.streak, target: 30 },
    { id: 'wellrounded', emoji: '🌟', label: 'Well-Rounded',  desc: 'Do every movement type',    current: st.patternsCovered, target: st.totalPatterns },
    { id: 'home',        emoji: '🏠', label: 'Home Hero',     desc: '10 home workouts',          current: st.homeCount, target: 10 },
    { id: 'gym',         emoji: '🏋️', label: 'Gym Strong',    desc: '10 gym workouts',           current: st.gymCount, target: 10 },
    { id: 'jump',        emoji: '⬆️', label: 'Jump Master',   desc: '25 jump moves',             current: st.byPattern.jump ?? 0,   target: 25 },
    { id: 'speed',       emoji: '⚡', label: 'Speed Demon',   desc: '25 speed moves',            current: st.byPattern.sprint ?? 0, target: 25 },
    { id: 'grip',        emoji: '🧗', label: 'Iron Grip',     desc: '25 pull moves',             current: st.byPattern.pull ?? 0,   target: 25 },
    { id: 'pr1',         emoji: '📈', label: 'Record Breaker', desc: 'Log your first record',    current: st.prCount, target: 1 },
    { id: 'pr5',         emoji: '👑', label: 'Record Hunter',  desc: 'Log 5 records',            current: st.prCount, target: 5 },
  ];

  return defs.map((d) => ({
    ...d,
    earned: d.current >= d.target,
    current: Math.min(d.current, d.target),
  }));
}
