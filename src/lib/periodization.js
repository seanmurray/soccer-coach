// Periodization, prescription, readiness — pure functions.
//
// MESOCYCLE STRUCTURE (revised 2026-05):
//
// 15-week macro repeating: each of the three triphasic blocks is a 4-week
// step-loading microcycle followed by a 1-week deload.
//
//   Wks 1-4   Accumulation  (W1 intro · W2 base · W3 peak · W4 back-off)
//   Wk  5     Deload
//   Wks 6-9   Transmutation (same step pattern)
//   Wk  10    Deload
//   Wks 11-14 Realization   (same step pattern)
//   Wk  15    Deload
//
// Step loading: intensity is multiplied by [.95, 1.00, 1.05, .85] across W1-W4.
// W3 is the peak; W4 is a planned back-off before deload — matches what
// masters-friendly programs (and OTA's revised SPS) prescribe.
//
// Spec §7 had a 9-week meso with one deload. That was leaving a 44-year-old
// athlete under one true rest every two months. The new shape gives a deload
// every 5 weeks while keeping triphasic block order intact.

import { EX_TO_MAX_KEY } from '../data/exercises';

const MESO_LEN = 15;
const PHASE_LEN = 4;            // 4 working weeks per phase
const DELOAD_OFFSETS = [5, 10, 15];

// Step-loading intensity multiplier within a phase, by weekInPhase (1-4).
// Applied to the phase's base intensity %.
export const INTENSITY_MULT = { 1: 0.95, 2: 1.00, 3: 1.05, 4: 0.85 };

// Phase recipe: base % of 1RM per lift, base reps, base sets, tempo. The
// week-specific output multiplies pct by INTENSITY_MULT[weekInPhase].
const PHASE_RECIPE = {
  accumulation: {
    reps: 4,
    sets: 5,
    tempo: { bench: '[5|1|X]', trapbar: '[3|1|X]', blgsq: '[4|2|X]' },
    basePct: { bench: 0.80, trapbar: 0.80, blgsq: 0.77 },
    note: 'Eccentric block: long lower, brief pause, explosive concentric. Bypasses GTO inhibition and builds tendon elasticity.',
  },
  transmutation: {
    reps: 3,
    sets: 5,
    tempo: { bench: '[1|5|X]', trapbar: '[1|4|X]', blgsq: '[1|5|X]' },
    basePct: { bench: 0.85, trapbar: 0.85, blgsq: 0.82 },
    note: 'Isometric block: long pause at the sticking point. Trains force production from a dead stop.',
  },
  realization: {
    reps: 2,
    sets: 6,
    tempo: { bench: '[1|1|X]', trapbar: '[1|1|X]', blgsq: '[1|1|X]' },
    basePct: { bench: 0.87, trapbar: 0.87, blgsq: 0.84 },
    note: 'Concentric / contrast block: maximum explosive intent. Pair each set with a jump for PAP.',
    contrast: {
      bench:   'After each set: 2 approach box jumps or broad jumps at max effort. 90 sec between pairs.',
      trapbar: 'After each heavy trap bar set: 1 max box jump. 90 sec rest. Heavy load potentiates CNS — the jump should feel lighter than normal.',
      blgsq:   'After each set: 1 single-leg broad jump each leg at max effort.',
    },
  },
  deload: {
    reps: 5,
    sets: 4,
    tempo: { bench: '[1|1|1]', trapbar: '[1|1|1]', blgsq: '[2|1|1]' },
    basePct: { bench: 0.50, trapbar: 0.50, blgsq: 0.50 },
    note: 'Deload — movement quality only. 50% intensity. Let the previous block consolidate.',
  },
};

// Mode multipliers applied to the final pct. Reps + sets are constant across
// modes (the mode affects intent + load, not the prescription shape).
//
// full   — prescribed intensity
// mod1   — minor fatigue, −15% off intensity
// mod2   — moderate fatigue, −25%, cap RPE 7.5
// mod3   — high fatigue, ~55% (motor pattern only)
// recovery — active recovery, 40-50%
const MODE_MULT = { full: 1.00, mod1: 0.85, mod2: 0.75, mod3: 0.55, recovery: 0.45 };

// Season volume scaling — applied to SET COUNT only; intensity (pct) is
// deliberately preserved. The strength-maintenance principle: strength is
// held with roughly a third of the volume that built it, so in-season you
// cut volume, not load. 'pre' is the no-op baseline (the program is authored
// for pre-season). Sets are floored at 2 so nothing collapses to a single
// working set.
//   off     — full build volume (off-season is the window to add)
//   pre     — as-authored baseline
//   in      — ~40% volume cut, maintain intensity + CNS headroom
//   playoff — minimal maintenance dose
const SEASON_VOLUME = { off: 1.0, pre: 1.0, in: 0.6, playoff: 0.5 };

// ─── PHASE LOOKUP ──────────────────────────────────────────
// Returns { phase, weekInPhase, weekInMeso, isDeload, mesoIndex, label }.
//   phase       — 'accumulation' | 'transmutation' | 'realization' | 'deload'
//   weekInPhase — 1-4 for work weeks, 0 for deload
//   isDeload    — true on weeks 5, 10, 15 (relative to start of meso)
//   label       — short human-readable label, e.g. "Accum W2", "Deload"
export function getPhaseInfo(week) {
  const w = ((week - 1) % MESO_LEN) + 1;
  const mesoIndex = Math.floor((week - 1) / MESO_LEN);

  if (DELOAD_OFFSETS.includes(w)) {
    return { phase: 'deload', weekInPhase: 0, weekInMeso: w, isDeload: true, mesoIndex, label: 'Deload' };
  }
  if (w <= PHASE_LEN) {
    return { phase: 'accumulation', weekInPhase: w, weekInMeso: w, isDeload: false, mesoIndex, label: `Accum W${w}` };
  }
  if (w <= 9) {
    const wip = w - 5;
    return { phase: 'transmutation', weekInPhase: wip, weekInMeso: w, isDeload: false, mesoIndex, label: `Trans W${wip}` };
  }
  const wip = w - 10;
  return { phase: 'realization', weekInPhase: wip, weekInMeso: w, isDeload: false, mesoIndex, label: `Real W${wip}` };
}

// Legacy helpers — kept for back-compat with code that imports getPhase /
// getPhaseLabel directly.
export const getPhase = (week) => getPhaseInfo(week).phase;
export const getPhaseLabel = (week) => getPhaseInfo(week).label;

// ─── STRENGTH PRESCRIPTION ─────────────────────────────────
// Returns { sets, reps, pct, tempo, note, contrast?, target_rpe }.
// `season` ('off'|'pre'|'in'|'playoff') scales set count only; defaults to
// 'pre' (no-op) so existing callers are unaffected.
export function getStrengthPrescription(exKey, week, mode, season = 'pre') {
  const info = getPhaseInfo(week);
  const recipe = PHASE_RECIPE[info.phase];

  const exMap = { bench_press: 'bench', floor_press: 'bench', trapbar_dl: 'trapbar', blg_split_sq: 'blgsq' };
  const key = exMap[exKey] || 'bench';

  // Within-phase step loading; deload weeks bypass the multiplier.
  const stepMult = info.isDeload ? 1 : (INTENSITY_MULT[info.weekInPhase] ?? 1);
  const modeMult = MODE_MULT[mode] ?? 1;

  const pct = Math.round(recipe.basePct[key] * stepMult * modeMult * 100) / 100;
  const target_rpe = deriveTargetRpe(info.phase, mode, info.weekInPhase);

  const seasonMult = SEASON_VOLUME[season] ?? 1;
  const sets = Math.max(2, Math.round(recipe.sets * seasonMult));

  const out = {
    sets,
    reps: recipe.reps,
    pct,
    tempo: recipe.tempo[key],
    note: stepNoteFor(info, recipe.note),
    target_rpe,
  };
  if (recipe.contrast?.[key]) out.contrast = recipe.contrast[key];
  return out;
}

function stepNoteFor(info, baseNote) {
  if (info.isDeload) return baseNote;
  const labels = {
    1: 'Week 1 — intro load, dial in technique. ',
    2: 'Week 2 — base load. ',
    3: 'Week 3 — peak intensity. Drive output. ',
    4: 'Week 4 — back-off before deload. Lighter load, full intent. ',
  };
  return (labels[info.weekInPhase] ?? '') + baseNote;
}

function deriveTargetRpe(phase, mode, weekInPhase) {
  if (mode === 'mod2') return 7.5;
  if (mode === 'mod3' || mode === 'recovery') return 7;
  if (phase === 'deload') return 6;
  // Within a work phase, push RPE in W3 (peak) and pull back in W4.
  if (weekInPhase === 3) return 8.5;
  if (weekInPhase === 4) return 7.5;
  return 8;
}

// ─── LOAD CALC ─────────────────────────────────────────────
// Recommended load = max × pct, rounded to nearest 2.5 lbs.
export function calcLoad(exKey, pct, maxes) {
  const k = EX_TO_MAX_KEY[exKey];
  if (!k || !maxes?.[k] || !pct) return 0;
  return Math.round((maxes[k] * pct) / 2.5) * 2.5;
}

// Render "[5|1|X]" → "Eccentric: 5 sec · Iso: 1 sec · Concentric: explosive".
export function tempoExplain(tempo) {
  const clean = tempo.replace(/[[\]]/g, '');
  const parts = clean.split('|');
  if (parts.length !== 3) return '';
  const labels = ['Eccentric (lower)', 'Isometric (pause)', 'Concentric (lift)'];
  return parts
    .map((piece, i) => `${labels[i]}: ${piece === 'X' ? 'explosive' : piece + ' sec'}`)
    .join(' · ');
}

// ─── READINESS ─────────────────────────────────────────────
//
// Composite readiness → training mode. Spec §5.
//
// Each input has a weight; together they sum to 100 when all six are
// present. When one or more inputs are null (e.g. no watch overnight =
// no battery/stress/recovery/sleep), we drop those terms AND drop their
// weight from the denominator so the remaining inputs still scale to 0-100.
//
// Edge case: if every objective input is missing and only self-reports remain,
// the score will lean heavily on body+mot. That's the right behavior — the
// user is telling us they have no objective signal today — but it makes the
// thresholds sensitive. We add a small safety: when no objective inputs are
// present at all, cap the mode at mod1 so we never recommend a "full" session
// on pure subjective feel.
//
// HRV-TREND (2nd arg `baseline`): the autonomic markers — battery & stress
// from Athlytic — mean more as a deviation from YOUR rolling norm than as
// absolute numbers (the HRV-monitoring evidence: rolling baseline + CV beats
// isolated readings). When a baseline { battery:{mean,sd}, stress:{mean,sd} }
// is supplied and the SD is large enough to trust, battery/stress are scored
// by how far today sits from your personal mean (±1 SD ≈ ±20 pts around the
// 50 midpoint) instead of by their raw value. rec/slp/body/mot keep absolute
// scoring. No baseline (or too-flat history) → original absolute behavior.

const WEIGHTS = { battery: 28, stress: 12, rec: 25, slp: 18, body: 10, mot: 7 };

const ABS_NORMALIZE = {
  battery: (v) => v,                                  // 0-100 → 0-100
  stress:  (v) => Math.max(0, ((60 - v) / 60) * 100), // 0-60 → inverted 0-100
  rec:     (v) => v,                                  // 0-100
  slp:     (v) => v,                                  // 0-100
  body:    (v) => (v / 5) * 100,                      // 1-5 → 0-100
  mot:     (v) => (v / 5) * 100,                      // 1-5 → 0-100
};

// SD floor below which the personal history is too flat to derive a
// meaningful z-score — fall back to absolute scoring for that metric.
const MIN_SD = { battery: 3, stress: 2 };
const DEV_SLOPE = 20; // 1 SD from personal norm = ±20 pts around the 50 midpoint

function normalizeReadiness(key, v, baseline) {
  const b = baseline?.[key];
  if ((key === 'battery' || key === 'stress') && b) {
    const { mean, sd } = b;
    if (Number.isFinite(mean) && Number.isFinite(sd) && sd >= MIN_SD[key]) {
      const z = (v - mean) / sd;
      const signed = key === 'stress' ? -z : z; // higher stress = worse
      return Math.max(0, Math.min(100, 50 + signed * DEV_SLOPE));
    }
  }
  return ABS_NORMALIZE[key](v);
}

const OBJECTIVE_KEYS = ['battery', 'stress', 'rec', 'slp'];

export function computeMode(inputs, baseline = null) {
  let weightedSum = 0;
  let weightTotal = 0;
  let presentObjective = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const v = inputs[key];
    if (v == null) continue;
    weightedSum += normalizeReadiness(key, v, baseline) * weight;
    weightTotal += weight;
    if (OBJECTIVE_KEYS.includes(key)) presentObjective += 1;
  }

  // Nothing at all → idle baseline (e.g. before user touches the sliders).
  if (weightTotal === 0) return { mode: 'mod1', score: 0, presentObjective };

  const score = weightedSum / weightTotal; // already on 0-100 because weights are percent points

  let mode;
  if (score >= 72) mode = 'full';
  else if (score >= 58) mode = 'mod1';
  else if (score >= 45) mode = 'mod2';
  else if (score >= 30) mode = 'mod3';
  else mode = 'recovery';

  // Cap at mod1 when we have zero objective signal — never recommend a full
  // session purely off self-reported feel.
  if (presentObjective === 0 && (mode === 'full')) mode = 'mod1';

  return { mode, score, presentObjective };
}

// ─── REST TIMER ────────────────────────────────────────────
// Default rest seconds by context + phase, then RPE adjustment. Spec §10.
const REST_DEFAULTS = {
  strength: { accumulation: 180, transmutation: 180, realization: 90, deload: 90 },
  build:    { accumulation: 90,  transmutation: 90,  realization: 90, deload: 90 },
  plyo:     { accumulation: 60,  transmutation: 60,  realization: 60, deload: 60 },
};

export function rpeRestAdjust(rpe) {
  if (rpe == null) return 0;
  if (rpe <= 6)   return -30;
  if (rpe <= 7.5) return -15;
  if (rpe === 8)  return 0;
  if (rpe <= 8.5) return 15;
  if (rpe <= 9)   return 30;
  return 60; // 9.5-10
}

export function getRestTime(context, week, rpe) {
  const phase = getPhase(week);
  const base = REST_DEFAULTS[context]?.[phase] ?? 90;
  return Math.max(30, base + rpeRestAdjust(rpe));
}
