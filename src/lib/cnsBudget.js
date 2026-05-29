// CNS budget — tracks neural-system fatigue across recent days.
//
// Why this matters: heavy strength sets, max-effort plyos, and sprint work
// all draw on the same CNS recovery pool. Stack three of them in 48 hours
// and you can be technically "recovered" by RPE but flat on output —
// missing the adaptation window and risking soft-tissue strain. Especially
// at 44, the CNS recovers slower than the muscles do.
//
// LOAD MODEL
//   Heavy strength set (rpe ≥ 8 with non-trivial weight)   = 1.0 unit
//   Max-effort strength (rpe ≥ 9)                           = 1.5 units (cap)
//   Plyo / agility / sprint with measurement logged         = 0.5 unit each
//     (these are the max-effort versions — measuring implies max intent)
//   Norwegian 4x4 / high-RPE conditioning (rpe ≥ 8)         = 2.0 units
//   HealthKit CARDIO workouts (push-workout ingest)         = zone-scaled
//     Z1/Z2 0, Z3 1.0, Z4 2.5, Z5 5.0 per 30 min, capped 2.5/workout
//     (see lib/trimp.js workoutCNSUnits). Folded into the 'cond' bucket.
//
//   COND RECONCILIATION: a conditioning effort can show up twice — once as a
//   logged cond perf row (RPE-based) and once as an HR-instrumented workout
//   linked to the same session. We take the MAX of the two, never the sum and
//   never a blind replace: the sensor should refine — and never silently lower
//   — a hard logged effort. Only CARDIO workout_types are folded (a HealthKit
//   "strength" or "yoga" workout is NOT charged as cardio CNS — that would
//   double-count the strength sets / mis-charge a recovery session).
//
// ZONES (over rolling 72 hours, today + previous 2 days)
//   <  3   green   — fresh, push the planned session
//   3-6    okay    — normal accumulation, stay the course
//   6-9    amber   — stacked, consider lighter intent
//   ≥ 9    red     — overdraft, deload or rest

import { workoutCNSUnits } from './trimp';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// HealthKit workout types that count as cardio CNS draw. Strength (double-
// counts logged sets), yoga (recovery), and unknown/other are excluded.
const CARDIO_TYPES = new Set([
  'running', 'cycling', 'walking', 'treadmill', 'elliptical', 'rowing', 'hiit', 'swimming',
]);

// Inputs:
//   sessions — soccer_sessions rows from the last 5 days (we use last 3)
//   sets     — soccer_sets rows joined to those sessions
//   perf     — soccer_exercise_perf rows joined to those sessions
//   workouts — soccer_workouts rows in the same window (HealthKit ingest)
//   hrMax    — calibrated HRmax for zoning the workouts
//   restHr   — validated resting HR for Karvonen zoning
//   now      — Date.now() for testing
export function computeCNSBudget({
  sessions = [], sets = [], perf = [], workouts = [],
  hrMax = undefined, restHr = undefined, now = Date.now(),
}) {
  const cutoff = now - 3 * MS_PER_DAY;
  const inWindow = (performedAt) => {
    if (!performedAt) return false;
    const [y, m, d] = performedAt.split('-').map(Number);
    return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12) >= cutoff;
  };

  const sessionsInWindow = sessions.filter((s) => inWindow(s.performed_at));
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

  // ── Strength (heavy sets) ──
  for (const s of sets) {
    if (!sessIds.has(s.session_id)) continue;
    const rpe = Number(s.rpe);
    if (!Number.isFinite(rpe) || rpe < 8) continue;
    const date = sessionDate(s.session_id);
    if (!date) continue;
    bump(date, 'strength', rpe >= 9 ? 1.5 : 1.0);
  }

  // ── Perf rows: plyo bumps now; cond accumulates for later reconciliation ──
  const condPerfBySession = {}; // session_id -> RPE-derived cond units
  for (const p of perf) {
    if (!sessIds.has(p.session_id)) continue;
    const date = sessionDate(p.session_id);
    if (!date) continue;
    const effortRpe = Number(p.effort_rpe);

    if (p.exercise_type === 'cond') {
      // High-RPE conditioning is a real CNS draw — Tabata, Norwegian 4x4,
      // court sprints all live here. Reconciled against linked HR workouts.
      const u = effortRpe >= 8 ? 2.0 : effortRpe >= 6 ? 0.5 : 0;
      if (u > 0) condPerfBySession[p.session_id] = (condPerfBySession[p.session_id] ?? 0) + u;
      continue;
    }

    // For plyo/agility, a logged measurement OR a high effort RPE signals a
    // max-effort attempt.
    const hasMeasure = typeof p.notes === 'string' && /\d+\s*(in|cm|m|mph)/i.test(p.notes);
    if (hasMeasure || effortRpe >= 8) bump(date, 'plyo', 0.5);
  }

  // ── HealthKit cardio workouts: zone-scaled CNS, grouped for reconciliation ──
  const cardioBySession = {};      // linked session_id -> units
  const cardioUnlinkedByDate = {}; // 'YYYY-MM-DD' -> units (standalone cardio)
  for (const w of workouts) {
    if (!inWindow(w.performed_at)) continue;
    if (!CARDIO_TYPES.has(w.workout_type)) continue;
    const u = workoutCNSUnits(w, { hrMax, restHr });
    if (u <= 0) continue;
    if (w.session_id && sessIds.has(w.session_id)) {
      cardioBySession[w.session_id] = (cardioBySession[w.session_id] ?? 0) + u;
    } else {
      cardioUnlinkedByDate[w.performed_at] = (cardioUnlinkedByDate[w.performed_at] ?? 0) + u;
    }
  }

  // ── Cond reconciliation: max(RPE-logged, HR-instrumented) per session ──
  for (const s of sessionsInWindow) {
    const condUnits = Math.max(condPerfBySession[s.id] ?? 0, cardioBySession[s.id] ?? 0);
    if (condUnits > 0) bump(s.performed_at, 'cond', condUnits);
  }
  for (const [date, u] of Object.entries(cardioUnlinkedByDate)) {
    if (u > 0) bump(date, 'cond', u);
  }

  const total = Object.values(perDay).reduce((sum, d) => sum + d.total, 0);
  let zone = 'green';
  if (total >= 9) zone = 'red';
  else if (total >= 6) zone = 'amber';
  else if (total >= 3) zone = 'okay';

  // workoutsInWindow lets the card render when there are workouts but no
  // soccer sessions yet — otherwise a Shortcut-only user wouldn't see CNS
  // contribution from their cardio.
  const workoutsInWindow = workouts.filter((w) => inWindow(w.performed_at));

  return {
    total: Math.round(total * 10) / 10,
    zone,
    perDay,
    sessionCount: sessionsInWindow.length,
    workoutCount: workoutsInWindow.length,
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
