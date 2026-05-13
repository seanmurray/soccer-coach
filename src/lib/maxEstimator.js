// 1RM estimator + auto-progression suggestions.
//
// METHOD — Tuchscherer RPE chart (Reactive Training Systems)
//
//   Empirically-derived 2D lookup mapping (reps, RPE) → %1RM. More accurate
//   than Brzycki + RIR for the realistic range we live in (1-8 reps @ RPE
//   7-9): the chart bakes in the non-linear relationship between RPE drop
//   and reps in reserve that a formula misses.
//
//   e1RM = weight / (chart[reps][rpe] / 100)
//
//   Edge cases:
//     - rpe outside [6, 10]: clamp
//     - reps > 10: clamp to 10-rep row (very conservative — past 10 reps,
//       1RM extrapolation is unreliable for any method)
//     - reps < 1 or weight missing: null
//
// AGGREGATION
//   Take the recent (last ~3 sessions) sets per main lift, compute e1RM per
//   set, take the median to avoid one outlier set dragging the estimate.
//
// SUGGESTION RULE
//   Suggest a bump only when:
//     - We have at least 3 completed sets across at least 2 sessions
//     - Median e1RM ≥ stored_max + 5 lbs
//   The new max is rounded down to the nearest 5 lb plate to keep
//   prescriptions feasible.
//
// We never auto-write the max — the user has to confirm. Settings stays the
// source of truth.

import { EX_TO_MAX_KEY } from '../data/exercises';

// Tuchscherer RPE → %1RM chart. Rows are reps (1-10), columns are RPE
// values (6 through 10, in 0.5 steps).
//
// The numbers below are the canonical values widely cited in RTS materials
// (Tuchscherer 2008, "Reactive Training Manual") and used in tools like
// StrengthLog, Boostcamp, FitnessVolt.
const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const TUCHSCHERER_CHART = {
  //          6    6.5   7    7.5   8    8.5   9    9.5  10
  1:  [86.3, 87.8, 89.2, 90.7, 92.2, 93.9, 95.5, 97.8, 100.0],
  2:  [83.7, 85.0, 86.3, 87.8, 89.2, 90.7, 92.2, 93.9, 95.5],
  3:  [81.1, 82.4, 83.7, 85.0, 86.3, 87.8, 89.2, 90.7, 92.2],
  4:  [78.6, 79.9, 81.1, 82.4, 83.7, 85.0, 86.3, 87.8, 89.2],
  5:  [76.2, 77.4, 78.6, 79.9, 81.1, 82.4, 83.7, 85.0, 86.3],
  6:  [73.9, 75.1, 76.2, 77.4, 78.6, 79.9, 81.1, 82.4, 83.7],
  7:  [70.7, 72.3, 73.9, 75.1, 76.2, 77.4, 78.6, 79.9, 81.1],
  8:  [68.0, 69.4, 70.7, 72.3, 73.9, 75.1, 76.2, 77.4, 78.6],
  9:  [65.3, 66.7, 68.0, 69.4, 70.7, 72.3, 73.9, 75.1, 76.2],
  10: [62.6, 64.0, 65.3, 66.7, 68.0, 69.4, 70.7, 72.3, 73.9],
};

// Look up the %1RM for (reps, rpe). Clamps out-of-range inputs.
// Returns null if the inputs are unusable (no reps, no weight).
function pctOfOneRM(reps, rpe) {
  if (reps == null || reps < 1) return null;
  const r = Math.min(10, Math.max(1, Math.round(reps)));
  const clampedRpe = Math.min(10, Math.max(6, rpe ?? 8));
  // Snap to nearest 0.5 — matches what the UI RPE picker offers anyway.
  const snappedRpe = Math.round(clampedRpe * 2) / 2;
  const colIdx = RPE_VALUES.indexOf(snappedRpe);
  if (colIdx === -1) return null;
  return TUCHSCHERER_CHART[r][colIdx];
}

export function estimate1RM(weight, reps, rpe) {
  if (!weight || !reps) return null;
  const pct = pctOfOneRM(reps, rpe);
  if (pct == null || pct <= 0) return null;
  return weight / (pct / 100);
}

const median = (xs) => {
  if (!xs.length) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};

const roundDownTo5 = (n) => Math.floor(n / 5) * 5;

// Inputs:
//   sets — array of soccer_sets rows with exercise_key, actual_weight,
//          actual_reps, rpe, session_id
//   maxes — current { trapbar, bsq, bench, blgsq }
//
// Output: array of suggestions, one per lift where a bump is warranted.
//   { maxKey, exerciseKey, currentMax, suggestedMax, e1RM, sampleSize,
//     sessionsCount }
export function buildMaxSuggestions(sets, maxes) {
  const byLift = {};
  for (const s of sets) {
    const maxKey = EX_TO_MAX_KEY[s.exercise_key];
    if (!maxKey) continue;
    if (!s.actual_weight || !s.actual_reps) continue;
    (byLift[maxKey] ??= []).push(s);
  }

  const out = [];
  for (const [maxKey, liftSets] of Object.entries(byLift)) {
    const e1RMs = liftSets.map((s) => estimate1RM(Number(s.actual_weight), s.actual_reps, Number(s.rpe))).filter(Number.isFinite);
    if (e1RMs.length < 3) continue;
    const sessions = new Set(liftSets.map((s) => s.session_id));
    if (sessions.size < 2) continue;

    const med = median(e1RMs);
    const currentMax = Number(maxes?.[maxKey] ?? 0);
    if (!currentMax) continue;
    if (med < currentMax + 5) continue;

    // Round down to nearest 5 lbs so we don't overshoot.
    const suggested = roundDownTo5(med);
    if (suggested <= currentMax) continue;

    out.push({
      maxKey,
      exerciseKey: liftSets[0].exercise_key,
      currentMax,
      suggestedMax: suggested,
      e1RM: Math.round(med),
      sampleSize: e1RMs.length,
      sessionsCount: sessions.size,
    });
  }

  // Sort by largest absolute headroom first — most actionable suggestions on top.
  out.sort((a, b) => (b.suggestedMax - b.currentMax) - (a.suggestedMax - a.currentMax));
  return out;
}
