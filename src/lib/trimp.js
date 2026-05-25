// Banister TRIMP — Training Impulse from heart-rate average + duration.
//
// REFERENCE: Banister 1991 — TRIMP = duration_min × HRr × b × e^(c·HRr)
// where HRr = (avg_HR - rest_HR) / (max_HR - rest_HR) is the heart-rate
// reserve fraction. Coefficients (b, c) are sex-specific from the original
// derivation; men's values used here since the app is single-athlete (44yo
// male per profile). Adjust if the audience widens.
//
// Why Banister vs. simpler models:
//   • Captures intensity nonlinearly — a 60-min Z4 effort produces ~3× the
//     load of a 60-min Z2 effort, matching real adaptive cost.
//   • Uses what we have (avg_hr, duration_sec) without needing time-in-zone.
//   • Most validated TRIMP variant; what most coaches mean by "TRIMP".
//
// Output is unitless "TRIMP load." NOT directly comparable to sRPE × min
// in absolute magnitude (scales differ by ~3×), but trend-comparable. We
// sum them in ACWR for the "combined" view while keeping a soccer-only
// number for clean comparison to historical baselines.

import { WORKING_HRMAX } from '../data/sessions';

// Resting HR. TODO: derive from soccer_biometrics (push-biometrics) when
// that's wired up. Until then, a literature-typical value for a trained
// 44yo masters athlete. The TRIMP formula is fairly tolerant — ±5 bpm here
// only shifts results a few percent at typical workout HRs.
export const RESTING_HR = 55;

// Banister men's coefficients.
const B_MALE = 0.64;
const C_MALE = 1.92;

// Compute Banister TRIMP. Returns null when inputs are insufficient so
// callers can decide whether to drop the workout entirely or fall back.
export function bannisterTRIMP({ avgHr, durationMin, restHr = RESTING_HR, maxHr = WORKING_HRMAX }) {
  if (!Number.isFinite(avgHr) || !Number.isFinite(durationMin)) return null;
  if (avgHr <= 0 || durationMin <= 0) return null;
  if (avgHr <= restHr) return 0; // sub-resting reading — treat as zero load
  if (maxHr <= restHr) return null; // bad config
  const hrr = Math.min(1, (avgHr - restHr) / (maxHr - restHr));
  const trimp = durationMin * hrr * B_MALE * Math.exp(C_MALE * hrr);
  return Math.round(trimp);
}

// Workout → TRIMP load. Encapsulates the soccer_workouts row shape so
// callers don't have to know the column names. Returns 0 (not null) when
// avg_hr is missing — so a workout with only duration still counts as
// something rather than disappearing from the load picture.
//
// The "duration unknown" fallback uses a flat 30 min so a logged-but-
// HR-less workout doesn't vanish; the ACWR card already does similar
// guards for soccer sessions.
const DEFAULT_DURATION_MIN = 30;

export function workoutTRIMP(workout) {
  if (!workout) return 0;
  const durationMin = workout.duration_sec ? workout.duration_sec / 60 : DEFAULT_DURATION_MIN;
  const avgHr = Number(workout.avg_hr);
  if (!Number.isFinite(avgHr) || avgHr <= 0) {
    // No HR — fall back to a moderate-zone estimate so the workout still
    // contributes. Half a TRIMP-equivalent for the duration assuming Z2-ish
    // effort (HRr ≈ 0.45 → ~0.4 TRIMP/min × duration).
    return Math.round(durationMin * 0.4);
  }
  return bannisterTRIMP({ avgHr, durationMin }) ?? 0;
}

// CNS contribution per workout, expressed in the same units cnsBudget.js
// uses (heavy strength set = 1.0, plyo = 0.5, hard cond protocol = 2.0).
//
// Rationale: high-intensity cardio (Z4/Z5) draws on the same neural pool
// as plyo/sprint work — VO2max intervals and threshold runs have real CNS
// cost. Z1/Z2 (recovery/aerobic) are metabolic, not neural; no CNS toll.
// Z3 (tempo) sits in between.
//
// Per-zone CNS units per 30 minutes of work (reference duration):
//   Z1 0.0  Z2 0.0  Z3 0.3  Z4 0.7  Z5 1.0
// Scaled linearly by duration so a 60-min Z4 workout = 1.4 units, same
// ballpark as 1-2 heavy strength sets.
const CNS_PER_30MIN = { Z1: 0, Z2: 0, Z3: 0.3, Z4: 0.7, Z5: 1.0 };

export function workoutCNSUnits(workout, zoneOfFn) {
  if (!workout || !workout.avg_hr) return 0;
  const durationMin = workout.duration_sec ? workout.duration_sec / 60 : DEFAULT_DURATION_MIN;
  if (durationMin <= 0) return 0;
  const zone = zoneOfFn(workout.avg_hr);
  if (!zone) return 0;
  const per30 = CNS_PER_30MIN[zone.code] ?? 0;
  return Math.round((per30 * (durationMin / 30)) * 10) / 10;
}
