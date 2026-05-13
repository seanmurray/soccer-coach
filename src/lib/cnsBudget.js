// CNS budget — tracks neural-system fatigue across recent days.
//
// Why this matters: heavy strength sets, max-effort plyos, and sprint work
// all draw on the same CNS recovery pool. Stack three of them in 48 hours
// and you can be technically "recovered" by RPE but flat on output —
// missing the adaptation window and risking soft-tissue strain. Especially
// at 44, the CNS recovers slower than the muscles do.
//
// LOAD MODEL
//   Heavy strength set (rpe ≥ 8 with non-trivial weight)  = 1.0 unit
//   Max-effort strength (rpe ≥ 9)                          = 1.5 units (cap)
//   Plyo / agility / sprint with measurement logged        = 0.5 unit each
//     (these are the max-effort versions — measuring implies max intent)
//   Norwegian 4x4 / high-RPE conditioning (rpe ≥ 8)         = 2.0 units
//
// ZONES (over rolling 72 hours, today + previous 2 days)
//   <  3   green   — fresh, push the planned session
//   3-6    okay    — normal accumulation, stay the course
//   6-9    amber   — stacked, consider lighter intent
//   ≥ 9    red     — overdraft, deload or rest

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Inputs:
//   sessions — soccer_sessions rows from the last 5 days (we use last 3)
//   sets     — soccer_sets rows joined to those sessions
//   perf     — soccer_exercise_perf rows joined to those sessions
//   now      — Date.now() for testing
export function computeCNSBudget({ sessions = [], sets = [], perf = [], now = Date.now() }) {
  const cutoff = now - 3 * MS_PER_DAY;
  const sessionsInWindow = sessions.filter((s) => {
    if (!s.performed_at) return false;
    const [y, m, d] = s.performed_at.split('-').map(Number);
    return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12) >= cutoff;
  });
  const sessIds = new Set(sessionsInWindow.map((s) => s.id));

  // Per-day buckets for the breakdown.
  const perDay = {}; // 'YYYY-MM-DD' -> { strength, plyo, cond, total }
  const bump = (date, kind, units) => {
    const day = (perDay[date] ??= { strength: 0, plyo: 0, cond: 0, total: 0 });
    day[kind] = (day[kind] ?? 0) + units;
    day.total += units;
  };

  const sessionDate = (sessionId) =>
    sessionsInWindow.find((s) => s.id === sessionId)?.performed_at ?? null;

  for (const s of sets) {
    if (!sessIds.has(s.session_id)) continue;
    const rpe = Number(s.rpe);
    if (!Number.isFinite(rpe) || rpe < 8) continue;
    const date = sessionDate(s.session_id);
    if (!date) continue;
    const units = rpe >= 9 ? 1.5 : 1.0;
    bump(date, 'strength', units);
  }

  for (const p of perf) {
    if (!sessIds.has(p.session_id)) continue;
    const date = sessionDate(p.session_id);
    if (!date) continue;
    const effortRpe = Number(p.effort_rpe);

    if (p.exercise_type === 'cond') {
      // High-RPE conditioning is a real CNS draw — Tabata, Norwegian 4x4,
      // court sprints all live here.
      if (effortRpe >= 8) bump(date, 'cond', 2.0);
      else if (effortRpe >= 6) bump(date, 'cond', 0.5);
      continue;
    }

    // For plyo/agility, the existence of a logged measurement OR a high
    // effort RPE signals a max-effort attempt.
    const hasMeasure = typeof p.notes === 'string' && /\d+\s*(in|cm|m|mph)/i.test(p.notes);
    if (hasMeasure || effortRpe >= 8) {
      bump(date, 'plyo', 0.5);
    }
  }

  const total = Object.values(perDay).reduce((sum, d) => sum + d.total, 0);
  let zone = 'green';
  if (total >= 9) zone = 'red';
  else if (total >= 6) zone = 'amber';
  else if (total >= 3) zone = 'okay';

  return {
    total: Math.round(total * 10) / 10,
    zone,
    perDay,
    sessionCount: sessionsInWindow.length,
  };
}

const ZONE_NARRATIVE = {
  green: { headline: 'Fresh', text: 'CNS is rested. Push the planned session with intent.' },
  okay:  { headline: 'Normal', text: 'Typical accumulation. Stay the course.' },
  amber: { headline: 'Stacked', text: 'Heavy days are piling up. Consider lighter intent today or move a CNS-intensive block to the next session.' },
  red:   { headline: 'Overdraft', text: 'Three days of high CNS draw in a row. Deload or rest today — adaptation already happened, more output without recovery just digs deeper.' },
};

export function cnsBudgetNarrative(zone) {
  return ZONE_NARRATIVE[zone] ?? ZONE_NARRATIVE.green;
}
