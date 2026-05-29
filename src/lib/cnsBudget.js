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
//   HealthKit workouts (push-workout ingest)                = zone-scaled
//     Z1/Z2 0, Z3 0.3, Z4 0.7, Z5 1.0 per 30 min (see lib/trimp.js)
//     Folded into the 'cond' bucket — they're the same kind of draw.
//
// ZONES (over rolling 72 hours, today + previous 2 days)
//   <  3   green   — fresh, push the planned session
//   3-6    okay    — normal accumulation, stay the course
//   6-9    amber   — stacked, consider lighter intent
//   ≥ 9    red     — overdraft, deload or rest

import { workoutCNSUnits } from './trimp';
import { zoneOf } from './hrZones';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Inputs:
//   sessions — soccer_sessions rows from the last 5 days (we use last 3)
//   sets     — soccer_sets rows joined to those sessions
//   perf     — soccer_exercise_perf rows joined to those sessions
//   workouts — soccer_workouts rows in the same window (HealthKit ingest)
//   hrMax    — calibrated HRmax for zoning the avg-HR fallback (workouts with
//              hr_zone_sec use their stored per-zone time directly)
//   now      — Date.now() for testing
export function computeCNSBudget({ sessions = [], sets = [], perf = [], workouts = [], hrMax = undefined, now = Date.now() }) {
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

  // Sessions that have an HR-instrumented workout linked to them get their
  // cond contribution REPLACED by the workout's TRIMP-based CNS estimate
  // (more accurate than RPE-only). Pre-compute the set so the perf loop
  // can skip cond rows from those sessions.
  const sessionsWithLinkedWorkout = new Set();
  for (const w of workouts) {
    if (w.session_id && sessIds.has(w.session_id)) {
      sessionsWithLinkedWorkout.add(w.session_id);
    }
  }

  for (const p of perf) {
    if (!sessIds.has(p.session_id)) continue;
    const date = sessionDate(p.session_id);
    if (!date) continue;
    const effortRpe = Number(p.effort_rpe);

    if (p.exercise_type === 'cond') {
      // Skip cond perf when an HR-instrumented workout is linked to this
      // session — the workout-derived units are the better signal and get
      // bumped below.
      if (sessionsWithLinkedWorkout.has(p.session_id)) continue;
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

  // HealthKit workouts: zone-scaled CNS contribution. Folded into 'cond'
  // because cardio shares the same neural-recovery pool as conditioning
  // protocols. Z1/Z2 workouts contribute zero so easy aerobic days don't
  // dent the budget. Counted whether the workout is linked or not — it's
  // the source of truth for cond load when linked, and a standalone
  // signal when not.
  for (const w of workouts) {
    if (!w.performed_at) continue;
    const [y, m, d] = w.performed_at.split('-').map(Number);
    const ts = Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12);
    if (ts < cutoff) continue;
    const units = workoutCNSUnits(w, (bpm) => zoneOf(bpm, hrMax));
    if (units > 0) bump(w.performed_at, 'cond', units);
  }

  const total = Object.values(perDay).reduce((sum, d) => sum + d.total, 0);
  let zone = 'green';
  if (total >= 9) zone = 'red';
  else if (total >= 6) zone = 'amber';
  else if (total >= 3) zone = 'okay';

  // workoutsInWindow lets the card render when there are workouts but no
  // soccer sessions yet — otherwise a Shortcut-only user wouldn't see CNS
  // contribution from their cardio.
  const workoutsInWindow = workouts.filter((w) => {
    if (!w.performed_at) return false;
    const [y, m, d] = w.performed_at.split('-').map(Number);
    return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12) >= cutoff;
  });

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
