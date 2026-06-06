// Personal-record helpers: save an attempt, find the current best, format it.

import { supabase } from './supabase';

export async function saveYouthPR({ exerciseKey, value, unit }) {
  if (!supabase) return { ok: false, error: new Error('No database connection') };
  const { error } = await supabase
    .from('youth_prs')
    .insert({ exercise_key: exerciseKey, value, unit: unit ?? null });
  if (error) return { ok: false, error };
  return { ok: true };
}

// Best value for a key from a list of PR rows.
export function bestForKey(rows, key, higherIsBetter = true) {
  const vals = rows.filter((r) => r.exercise_key === key).map((r) => Number(r.value));
  if (vals.length === 0) return null;
  return higherIsBetter ? Math.max(...vals) : Math.min(...vals);
}

// Map of exercise_key -> best value, for quick lookup.
export function bestMap(rows, exerciseByKey) {
  const out = {};
  for (const r of rows) {
    const hib = exerciseByKey[r.exercise_key]?.pr?.higherIsBetter ?? true;
    const v = Number(r.value);
    if (out[r.exercise_key] == null) out[r.exercise_key] = v;
    else out[r.exercise_key] = hib ? Math.max(out[r.exercise_key], v) : Math.min(out[r.exercise_key], v);
  }
  return out;
}

// "52 in" / "45s" / "12 reps"
export function formatPr(value, pr) {
  if (value == null) return '—';
  if (!pr) return String(value);
  if (pr.unit === 'sec') return `${value}s`;
  if (pr.unit === 'reps') return `${value} reps`;
  return `${value} ${pr.unit}`;
}
