// XP + levels. XP is a pure function of saved history (no stored counter), so
// it always recomputes correctly:
//   • 10 XP per completed move
//   • 25 XP for finishing a session
//   • 20 XP per personal record logged
//
// Levels reward early progress fast, then stretch out. A typical ~13-move
// bodyweight day is ~155 XP, so the first level-up comes after one workout.

export const XP_PER_MOVE = 10;
export const XP_PER_SESSION = 25;
export const XP_PER_PR = 20;

export const LEVELS = [
  { level: 1, name: 'Rookie',   min: 0 },
  { level: 2, name: 'Starter',  min: 150 },
  { level: 3, name: 'Varsity',  min: 400 },
  { level: 4, name: 'All-Star', min: 800 },
  { level: 5, name: 'Pro',      min: 1400 },
  { level: 6, name: 'Elite',    min: 2200 },
  { level: 7, name: 'Champion', min: 3200 },
  { level: 8, name: 'Legend',   min: 4500 },
];

// XP earned by a single session (used for the "+N XP" finish splash).
export function sessionXp(completedMoves) {
  return completedMoves * XP_PER_MOVE + XP_PER_SESSION;
}

export function computeXp(sessions = [], prs = []) {
  const fromSessions = sessions.reduce(
    (sum, s) => sum + (s.completed ?? 0) * XP_PER_MOVE + XP_PER_SESSION,
    0
  );
  return fromSessions + prs.length * XP_PER_PR;
}

// Resolve a total XP into level info + progress toward the next level.
export function levelForXp(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) current = l;
  const next = LEVELS.find((l) => l.min > current.min) || null;

  if (!next) {
    return { ...current, xp, isMax: true, into: xp - current.min, span: 0, pct: 100, toNext: 0 };
  }
  const into = xp - current.min;
  const span = next.min - current.min;
  return {
    ...current,
    xp,
    isMax: false,
    next,
    into,
    span,
    pct: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
    toNext: next.min - xp,
  };
}
