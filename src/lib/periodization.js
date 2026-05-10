// Periodization, prescription, readiness — pure functions extracted from
// soccer_performance_coach_v9.html. No DOM, no state, no I/O — these are
// what the workout-builder + readiness UI both consume.
//
// Spec sections: §5 (readiness), §7 (periodization), §10 (rest timer).

import { EX_TO_MAX_KEY } from '../data/exercises';

// ─── PHASE ─────────────────────────────────────────────────
// 9-week triphasic cycle: weeks 1-2 accumulation, 3-5 transmutation,
// 6-8 realization, 9 deload. Cycles indefinitely after week 9.
export function getPhase(week) {
  const w = ((week - 1) % 9) + 1;
  if (w <= 2) return 'accumulation';
  if (w <= 5) return 'transmutation';
  if (w <= 8) return 'realization';
  return 'deload';
}

const PHASE_LABELS = {
  accumulation:   'Accumulation',
  transmutation:  'Transmutation',
  realization:    'Realization',
  deload:         'Deload',
};

export const getPhaseLabel = (week) => PHASE_LABELS[getPhase(week)];

// ─── STRENGTH PRESCRIPTION ─────────────────────────────────
// Returns { sets, reps, pct, tempo, note, contrast? } for the main strength
// lift, scaled by phase × week × mode. Mirrors v9 getStrengthPrescription.
//
// Mode mapping: full → full, mod1 → modified+15% interpolation, mod2 →
// modified, mod3/recovery → recovery. The mod1 interpolation lifts pct
// 60% of the way back toward full to model the "−15% off full" intent.
export function getStrengthPrescription(exKey, week, mode) {
  const phase = getPhase(week);
  const w = ((week - 1) % 9) + 1;

  const p = {
    accumulation: {
      full: {
        bench:   { sets: 5, reps: w === 1 ? 4 : 3, pct: w === 1 ? 0.78 : 0.82, tempo: '[5|1|X]', note: 'Eccentric block: 5 sec lower, 1 sec pause, explosive up. Accumulation = eccentric emphasis — bypasses GTO inhibition, builds tendon elasticity.' },
        trapbar: { sets: 5, reps: w === 1 ? 4 : 3, pct: w === 1 ? 0.78 : 0.82, tempo: '[3|1|X]', note: 'Eccentric block: 3 sec controlled lower to floor, 1 sec pause, drive through floor explosively. Deadlift eccentric is shorter than squat — 3 sec is appropriate and matches OTA Soccer Performance System prescription.' },
        blgsq:   { sets: 5, reps: w === 1 ? 5 : 4, pct: w === 1 ? 0.75 : 0.78, tempo: '[4|2|X]', note: 'Eccentric block: 4 sec lower, 2 sec pause at bottom, explosive up. Unilateral movements get a longer eccentric — harder to control, more injury-prevention benefit. OTA SPS uses this exact prescription.' },
      },
      modified: {
        bench:   { sets: 4, reps: 4, pct: 0.68, tempo: '[3|1|X]', note: 'Cap RPE 7' },
        trapbar: { sets: 4, reps: 4, pct: 0.68, tempo: '[3|1|X]', note: 'Cap RPE 7' },
        blgsq:   { sets: 3, reps: 6, pct: 0.65, tempo: '[3|1|X]', note: 'Cap RPE 7' },
      },
      recovery: {
        bench:   { sets: 3, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: '50% — technique only' },
        trapbar: { sets: 3, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: '50% — technique only' },
        blgsq:   { sets: 2, reps: 8, pct: 0.45, tempo: '[2|1|1]', note: 'Very light' },
      },
    },
    transmutation: {
      full: {
        bench:   { sets: 5, reps: w <= 4 ? 3 : 2, pct: w <= 4 ? 0.82 : 0.87, tempo: '[1|5|X]', note: '5 sec iso pause at sticking point' },
        trapbar: { sets: 5, reps: w <= 4 ? 3 : 2, pct: w <= 4 ? 0.82 : 0.87, tempo: '[1|4|X]', note: 'Iso pause at knee height' },
        blgsq:   { sets: 5, reps: w <= 4 ? 4 : 3, pct: w <= 4 ? 0.80 : 0.85, tempo: '[1|5|X]', note: '5 sec iso at parallel' },
      },
      modified: {
        bench:   { sets: 4, reps: 3, pct: 0.72, tempo: '[1|3|X]', note: 'Cap RPE 7' },
        trapbar: { sets: 4, reps: 3, pct: 0.72, tempo: '[1|3|X]', note: 'Cap RPE 7' },
        blgsq:   { sets: 3, reps: 5, pct: 0.68, tempo: '[1|3|X]', note: 'Cap RPE 7' },
      },
      recovery: {
        bench:   { sets: 3, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: 'Deload' },
        trapbar: { sets: 3, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: 'Deload' },
        blgsq:   { sets: 2, reps: 8, pct: 0.45, tempo: '[1|1|1]', note: 'Very light' },
      },
    },
    realization: {
      full: {
        bench:   { sets: 6, reps: w <= 7 ? 3 : 2, pct: w <= 7 ? 0.85 : 0.88, tempo: '[1|1|X]', note: 'Max concentric intent', contrast: 'After each set: 2 approach box jumps or broad jumps at max effort. 90 sec rest between pairs.' },
        trapbar: { sets: 6, reps: w <= 7 ? 3 : 2, pct: w <= 7 ? 0.85 : 0.88, tempo: '[1|1|X]', note: 'Contrast — pair with box jump', contrast: 'After each heavy trap bar set: 1 max box jump. 90 sec rest. The heavy set potentiates CNS — the jump should feel lighter than normal.' },
        blgsq:   { sets: 5, reps: w <= 7 ? 4 : 3, pct: w <= 7 ? 0.83 : 0.86, tempo: '[1|1|X]', note: 'Explosive concentric', contrast: 'After each set: 1 single-leg broad jump each leg at max effort.' },
      },
      modified: {
        bench:   { sets: 4, reps: 3, pct: 0.75, tempo: '[1|1|X]', note: 'Cap RPE 7 — still explosive' },
        trapbar: { sets: 4, reps: 3, pct: 0.75, tempo: '[1|1|X]', note: 'Cap RPE 7' },
        blgsq:   { sets: 3, reps: 5, pct: 0.72, tempo: '[1|1|X]', note: 'Cap RPE 7' },
      },
      recovery: {
        bench:   { sets: 3, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: 'Deload' },
        trapbar: { sets: 3, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: 'Deload' },
        blgsq:   { sets: 2, reps: 8, pct: 0.45, tempo: '[1|1|1]', note: 'Very light' },
      },
    },
    deload: {
      full: {
        bench:   { sets: 4, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: '50% — movement quality' },
        trapbar: { sets: 4, reps: 5, pct: 0.50, tempo: '[1|1|1]', note: '50%' },
        blgsq:   { sets: 3, reps: 8, pct: 0.50, tempo: '[2|1|1]', note: 'Light' },
      },
      modified: {
        bench:   { sets: 3, reps: 5, pct: 0.45, tempo: '[1|1|1]', note: 'Very light' },
        trapbar: { sets: 3, reps: 5, pct: 0.45, tempo: '[1|1|1]', note: 'Very light' },
        blgsq:   { sets: 2, reps: 8, pct: 0.40, tempo: '[1|1|1]', note: 'Very light' },
      },
      recovery: {
        bench:   { sets: 2, reps: 5, pct: 0.40, tempo: '[1|1|1]', note: 'Minimal' },
        trapbar: { sets: 2, reps: 5, pct: 0.40, tempo: '[1|1|1]', note: 'Minimal' },
        blgsq:   { sets: 2, reps: 6, pct: 0.40, tempo: '[1|1|1]', note: 'Minimal' },
      },
    },
  };

  const exMap = { bench_press: 'bench', floor_press: 'bench', trapbar_dl: 'trapbar', blg_split_sq: 'blgsq' };
  const key = exMap[exKey] || 'bench';

  const prescMode = ({ full: 'full', mod1: 'mod1adj', mod2: 'modified', mod3: 'recovery', recovery: 'recovery' })[mode] || 'full';
  const phasePrx = p[phase] || p.accumulation;

  // mod1 = full lift minus 15% — interpolate between full and modified.
  if (prescMode === 'mod1adj') {
    const modBase = phasePrx.modified?.[key] ?? phasePrx.full[key];
    const fullBase = phasePrx.full?.[key] ?? null;
    if (modBase && fullBase) {
      const adjPct = fullBase.pct - (fullBase.pct - modBase.pct) * 0.6;
      return {
        ...modBase,
        pct: Math.round(adjPct * 100) / 100,
        sets: modBase.sets,
        note: modBase.note + ' (mod1: –15%)',
      };
    }
    return modBase || phasePrx.full[key];
  }

  const prxMode = phasePrx[prescMode] ? prescMode : 'full';
  const modeBlock = phasePrx[prxMode];
  return modeBlock?.[key] ?? p.accumulation.full.bench;
}

// Recommended load = max × pct, rounded to nearest 2.5 lbs. Returns 0 if the
// max isn't set — UI should show a placeholder in that case.
export function calcLoad(exKey, pct, maxes) {
  const k = EX_TO_MAX_KEY[exKey];
  if (!k || !maxes?.[k] || !pct) return 0;
  return Math.round((maxes[k] * pct) / 2.5) * 2.5;
}

// Render a tempo string like "[5|1|X]" into a humanized phase breakdown.
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
// Composite readiness score → training mode. Spec §5.
export function computeMode({ rec, slp, body, mot, battery, stress }) {
  const stressInv = Math.max(0, ((60 - stress) / 60) * 100);
  const score =
    battery * 0.28 +
    stressInv * 0.12 +
    rec * 0.25 +
    slp * 0.18 +
    (body / 5) * 10 +
    (mot / 5) * 7;

  if (score >= 72) return { mode: 'full',     score };
  if (score >= 58) return { mode: 'mod1',     score };
  if (score >= 45) return { mode: 'mod2',     score };
  if (score >= 30) return { mode: 'mod3',     score };
  return                { mode: 'recovery', score };
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
