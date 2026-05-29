// Workout training-load + CNS cost.
//
// ── LOAD: one unit shared with soccer sessions (Foster session-RPE × min) ──
// Soccer sessions are scored as Foster sRPE × duration_min. To make the ACWR
// "combined" view a single coherent number (not a sum of incompatible scales),
// workouts are scored on the SAME unit: for each HR zone we assign the Borg
// RPE you'd report for sustained work in that zone, and sum minutes × RPE:
//
//   load = Σ (minutes_in_zone × FOSTER_ZONE_RPE[zone])
//
// This deliberately replaces the old Edwards/Banister TRIMP path, which mixed
// two scales (Edwards ≈2× Banister) in the same metric depending on whether a
// workout carried time-in-zone — producing ratio artifacts from the scale
// switch rather than real load changes. Foster-per-zone keeps workouts and
// sessions commensurable so combined load and its ratio are meaningful.
//
// Validation anchors (HRmax 185 / RHR 60, Karvonen zones):
//   60-min continuous Z4 (threshold)  = 60 × 8   = 480  ≈ a hard soccer session
//   33-min easy run, avg 147 = Z2     = 33 × 4   ≈ 132  (~⅓ of a session)
//
// ── CNS: neural-fatigue contribution (units, see cnsBudget.js scale) ──
// High-intensity cardio (Z4/Z5) draws on the same neural pool as plyo/sprint
// work; Z1/Z2 are metabolic, not neural. Weights are tuned so a real VO2max
// session (Norwegian 4×4 ≈ 8 min Z4 + 8 min Z5) ≈ 2.0 units — matching the
// "hard cond protocol = 2.0" already in the CNS model — with a per-workout cap
// so a single long high-intensity session can't dominate the budget.

import { WORKING_HRMAX, WORKING_RESTHR } from '../data/sessions';
import { zoneOf, zoneSecForWorkout } from './hrZones';

// Resting-HR fallback (kept for any caller that doesn't thread the live value).
// The live value comes from soccer_biometrics.rhr_bpm (= 60, validated).
export const RESTING_HR = WORKING_RESTHR;

// Foster RPE-equivalent per HR zone (Borg CR10), settled with the athlete.
const FOSTER_ZONE_RPE = { Z1: 2, Z2: 4, Z3: 6, Z4: 8, Z5: 9.5 };

const DEFAULT_DURATION_MIN = 30;

// Foster load from a {Z1..Z5: seconds} map. Σ(minutes_in_zone × RPE_eq).
// Returns null when the map is missing/empty so callers can fall back.
export function fosterFromZoneSec(zoneSec) {
  if (!zoneSec || typeof zoneSec !== 'object') return null;
  let total = 0;
  let any = false;
  for (const code of Object.keys(FOSTER_ZONE_RPE)) {
    const sec = Number(zoneSec[code]);
    if (Number.isFinite(sec) && sec > 0) {
      total += (sec / 60) * FOSTER_ZONE_RPE[code];
      any = true;
    }
  }
  return any ? Math.round(total) : null;
}

// Workout → training load on the Foster sRPE×min scale.
// 1) True time-in-zone (from hr_hist, recomputed live; or legacy hr_zone_sec)
//    → Foster per-zone (preferred).
// 2) Avg HR → single-zone estimate × duration (whole workout charged at the
//    avg HR's zone). Less precise but same unit.
// 3) No HR at all → assume easy aerobic (Z1 rate) for the duration.
// Returns 0 (not null) for an empty workout so it simply doesn't contribute.
export function workoutLoad(workout, { hrMax = WORKING_HRMAX, restHr = WORKING_RESTHR } = {}) {
  if (!workout) return 0;
  const durationMin = workout.duration_sec ? workout.duration_sec / 60 : DEFAULT_DURATION_MIN;

  const zoneSec = zoneSecForWorkout(workout, hrMax, restHr);
  const fromZones = fosterFromZoneSec(zoneSec);
  if (fromZones != null && fromZones > 0) return fromZones;

  const avgHr = Number(workout.avg_hr);
  if (Number.isFinite(avgHr) && avgHr > 0) {
    const z = zoneOf(avgHr, hrMax, restHr);
    const rpe = z ? FOSTER_ZONE_RPE[z.code] : FOSTER_ZONE_RPE.Z1;
    return Math.round(durationMin * rpe);
  }

  // No HR — assume light aerobic effort for the duration.
  return Math.round(durationMin * FOSTER_ZONE_RPE.Z1);
}

// Per-zone CNS units per 30 minutes of work (reference duration). Z1/Z2 carry
// no neural cost (aerobic = metabolic). Tuned so a Norwegian 4×4 (≈8 min Z4 +
// 8 min Z5) ≈ 2.0 units = "hard cond protocol"; a 30-min steady-threshold run
// hits the cap (2.5). Scaled linearly by time-in-zone, then capped per workout.
const CNS_PER_30MIN = { Z1: 0, Z2: 0, Z3: 1.0, Z4: 2.5, Z5: 5.0 };
export const CNS_WORKOUT_CAP = 2.5;

// CNS contribution for a single workout, in cnsBudget.js units. Uses true
// time-in-zone when available (so a run that only briefly touched Z5 is charged
// for those minutes, not the whole duration); falls back to the avg-HR zone.
// NOTE: workout-type gating (cardio only — never strength/yoga) is the caller's
// job (cnsBudget.js); this function just scores the HR profile it's given.
export function workoutCNSUnits(workout, { hrMax = WORKING_HRMAX, restHr = WORKING_RESTHR } = {}) {
  if (!workout) return 0;
  const durationMin = workout.duration_sec ? workout.duration_sec / 60 : DEFAULT_DURATION_MIN;
  if (durationMin <= 0) return 0;

  let units = 0;
  const zoneSec = zoneSecForWorkout(workout, hrMax, restHr);
  if (zoneSec) {
    for (const code of Object.keys(CNS_PER_30MIN)) {
      const sec = Number(zoneSec[code]);
      if (Number.isFinite(sec) && sec > 0) units += CNS_PER_30MIN[code] * (sec / 60 / 30);
    }
  } else {
    // Fallback: charge the whole duration at the avg-HR zone's rate.
    const avgHr = Number(workout.avg_hr);
    if (!Number.isFinite(avgHr) || avgHr <= 0) return 0;
    const z = zoneOf(avgHr, hrMax, restHr);
    if (!z) return 0;
    const per30 = CNS_PER_30MIN[z.code] ?? 0;
    units = per30 * (durationMin / 30);
  }

  const capped = Math.min(units, CNS_WORKOUT_CAP);
  return Math.round(capped * 10) / 10;
}
