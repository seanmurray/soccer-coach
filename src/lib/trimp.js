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

// Resting HR fallback. The live value is pulled from soccer_biometrics
// (push-biometrics → rhr_bpm) and threaded through workoutTRIMP; this
// constant is only used when no biometric reading is available. The TRIMP
// formula is fairly tolerant — ±5 bpm here only shifts results a few percent.
export const RESTING_HR = 55;

// Edwards TRIMP zone weights (Z1=1 … Z5=5). The Edwards summation —
// Σ(minutes_in_zone × weight) — is the load model we prefer for workouts
// because it captures interval structure that a single average HR hides: a
// 30-min run alternating Z2 and Z5 carries far more load than 30 steady
// minutes at the same MEAN heart rate.
const EDWARDS_WEIGHTS = { Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5 };

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

const DEFAULT_DURATION_MIN = 30;

// Edwards TRIMP from a {Z1..Z5: seconds} map. Σ(minutes_in_zone × weight).
// Returns null when the map is missing/empty so callers can fall back.
export function edwardsTRIMP(zoneSec) {
  if (!zoneSec || typeof zoneSec !== 'object') return null;
  let total = 0;
  let any = false;
  for (const code of Object.keys(EDWARDS_WEIGHTS)) {
    const sec = Number(zoneSec[code]);
    if (Number.isFinite(sec) && sec > 0) {
      total += (sec / 60) * EDWARDS_WEIGHTS[code];
      any = true;
    }
  }
  return any ? Math.round(total) : null;
}

// Workout → training load. Prefers true time-in-zone (Edwards, from
// hr_zone_sec computed at ingest); falls back to Banister from the average HR
// (this is where real resting HR matters), then to a flat light estimate when
// there's no HR at all. Returns 0 (not null) for an empty workout so it just
// doesn't contribute.
//
// SCALE NOTE: Edwards and Banister produce different magnitudes for the same
// effort (Edwards runs ~2× higher). Going forward every workout carries
// hr_zone_sec → Edwards, so the fallback only applies to pre-feature rows,
// which age out of the 28-day ACWR window within a month. The transient
// mixing affects only the supplementary "combined" view, never the headline
// soccer-only number.
export function workoutTRIMP(workout, { restHr = RESTING_HR, hrMax = WORKING_HRMAX } = {}) {
  if (!workout) return 0;
  const durationMin = workout.duration_sec ? workout.duration_sec / 60 : DEFAULT_DURATION_MIN;

  // 1) True time-in-zone → Edwards (preferred).
  const fromZones = edwardsTRIMP(workout.hr_zone_sec);
  if (fromZones != null && fromZones > 0) return fromZones;

  // 2) Avg HR → Banister, using the athlete's real resting HR + calibrated max.
  const avgHr = Number(workout.avg_hr);
  if (Number.isFinite(avgHr) && avgHr > 0) {
    return bannisterTRIMP({ avgHr, durationMin, restHr, maxHr: hrMax }) ?? 0;
  }

  // 3) No HR at all — assume light aerobic effort for the duration.
  return Math.round(durationMin * 0.4);
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
  if (!workout) return 0;
  const durationMin = workout.duration_sec ? workout.duration_sec / 60 : DEFAULT_DURATION_MIN;
  if (durationMin <= 0) return 0;

  // Prefer per-zone time when available — only the Z4/Z5 minutes carry CNS
  // cost, so a run that touched Z5 briefly but mostly sat in Z2 is charged
  // accurately rather than getting full Z-of-avg credit (or none).
  const zs = workout.hr_zone_sec;
  if (zs && typeof zs === 'object') {
    let units = 0;
    for (const code of Object.keys(CNS_PER_30MIN)) {
      const sec = Number(zs[code]);
      if (Number.isFinite(sec) && sec > 0) units += CNS_PER_30MIN[code] * (sec / 60 / 30);
    }
    return Math.round(units * 10) / 10;
  }

  // Fallback: charge the whole duration at the avg-HR zone's rate.
  if (!workout.avg_hr) return 0;
  const zone = zoneOfFn(workout.avg_hr);
  if (!zone) return 0;
  const per30 = CNS_PER_30MIN[zone.code] ?? 0;
  return Math.round((per30 * (durationMin / 30)) * 10) / 10;
}
