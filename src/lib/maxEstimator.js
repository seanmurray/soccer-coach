// 1RM estimator + auto-progression suggestions.
//
// METHOD
//   For each completed set: figure out how many reps the user could have done
//   to true failure (RPE 10) — i.e. effective reps. Then Brzycki the estimate.
//
//     effectiveReps = actualReps + (10 - actualRpe)         // RIR-adjusted
//     e1RM          = weight / (1.0278 - 0.0278 × effReps)  // Brzycki
//
//   We cap effectiveReps at 10 (Brzycki accuracy degrades past that).
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

const BRZYCKI_CAP = 10;

export function estimate1RM(weight, reps, rpe) {
  if (!weight || !reps) return null;
  const effRpe = Math.min(10, Math.max(5, rpe ?? 8));
  const effReps = Math.min(BRZYCKI_CAP, reps + (10 - effRpe));
  if (effReps <= 0) return null;
  const denom = 1.0278 - 0.0278 * effReps;
  if (denom <= 0) return null;
  return weight / denom;
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
