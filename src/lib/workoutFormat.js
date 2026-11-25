// Small pure helpers shared by the workout UI (kept out of component files
// so React Fast Refresh stays happy).

// RPE → plain-words meaning, shown under the RPE stepper.
export const RPE_WORDS = {
  6: 'Easy — could do 4 more reps',
  6.5: 'Could do 3–4 more reps',
  7: 'Could do 3 more reps',
  7.5: 'Could do 2–3 more reps',
  8: 'Could do 2 more reps',
  8.5: 'Could do 1–2 more reps',
  9: 'Could do 1 more rep',
  9.5: 'Maybe 1 more rep',
  10: 'Max effort — nothing left',
};

export function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// One-line summary of a past session's sets: "4×5 · @ 225 lbs · RPE 8".
export function summarizeSets(sets) {
  if (!sets?.length) return '—';
  const valid = sets.filter((s) => s.actual_reps != null || s.actual_weight != null);
  if (!valid.length) return '—';

  const weights = valid.map((s) => s.actual_weight ?? 0);
  const topWeight = Math.max(...weights);
  const atTop = valid.filter((s) => (s.actual_weight ?? 0) === topWeight);
  const topReps = Math.max(...atTop.map((s) => s.actual_reps ?? 0));
  const rpes = valid.map((s) => s.rpe ?? 0).filter((n) => n > 0);
  const topRpe = rpes.length ? Math.max(...rpes) : null;

  // Seconds-logged sets read "3×45 sec" instead of bare reps.
  const secs = valid.some((s) => s.unit === 'secs');
  const parts = [`${valid.length}×${topReps}${secs ? ' sec' : ''}`];
  if (topWeight > 0) parts.push(`@ ${topWeight} lbs`);
  if (topRpe != null) parts.push(`RPE ${topRpe}`);
  return parts.join(' · ');
}

export const RAMP_BAR = 45;
const BAR = RAMP_BAR;
const round5 = (n) => Math.round(n / 5) * 5;

// Ramp-up sets toward today's first working weight: empty bar × 10, then
// 40% × 5, 60% × 3, 80% × 2 (rounded to 5 lb, deduped, never above the top).
export function rampSets(top) {
  if (!top || top <= BAR) return [];
  const steps = [
    { weight: BAR, reps: 10 },
    { weight: round5(top * 0.4), reps: 5 },
    { weight: round5(top * 0.6), reps: 3 },
    { weight: round5(top * 0.8), reps: 2 },
  ];
  const out = [];
  for (const s of steps) {
    if (s.weight < BAR || s.weight >= top) continue;
    if (out.some((o) => o.weight === s.weight)) continue;
    out.push(s);
  }
  return out;
}

