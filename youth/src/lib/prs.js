// Per-exercise log + personal-record helpers.
//
// One row per attempt in youth_prs (the table name predates this expansion —
// "PR" originally meant "personal record", but each row is now any logged
// attempt; the PR is derived as max(value) across history for an exercise_key.
// "Last" is just the most recent row.

import { supabase } from './supabase';
import { ATHLETE } from '../config/athlete';

export async function saveYouthPR({ exerciseKey, value, unit }) {
  if (!supabase) return { ok: false, error: new Error('No database connection') };
  const { error } = await supabase
    .from('youth_prs')
    .insert({
      athlete_id: ATHLETE.id,
      exercise_key: exerciseKey,
      value,
      unit: unit ?? null,
    });
  if (error) return { ok: false, error };
  return { ok: true };
}

// Best value for a key from a list of attempt rows.
export function bestForKey(rows, key, higherIsBetter = true) {
  const vals = rows.filter((r) => r.exercise_key === key).map((r) => Number(r.value));
  if (vals.length === 0) return null;
  return higherIsBetter ? Math.max(...vals) : Math.min(...vals);
}

// Most-recent value for a key (rows assumed newest-first from the query hook).
export function lastForKey(rows, key) {
  const r = rows.find((row) => row.exercise_key === key);
  return r ? Number(r.value) : null;
}

// Map of exercise_key → best value, for batch lookup on the Progress hub.
export function bestMap(rows, exerciseByKey) {
  const out = {};
  for (const r of rows) {
    const hib = exerciseByKey[r.exercise_key]?.log?.higherIsBetter
      ?? exerciseByKey[r.exercise_key]?.pr?.higherIsBetter
      ?? true;
    const v = Number(r.value);
    if (out[r.exercise_key] == null) out[r.exercise_key] = v;
    else out[r.exercise_key] = hib ? Math.max(out[r.exercise_key], v) : Math.min(out[r.exercise_key], v);
  }
  return out;
}

// Map of exercise_key → most-recent value. Rows must be newest-first.
export function lastMap(rows) {
  const out = {};
  for (const r of rows) {
    if (out[r.exercise_key] == null) out[r.exercise_key] = Number(r.value);
  }
  return out;
}

// "52 in" / "45s" / "12 reps" — `log` works as the formatter spec
// (kind/unit/label). Accepts the legacy `pr` shape for backwards compat.
export function formatLog(value, spec) {
  if (value == null) return '—';
  if (!spec) return String(value);
  if (spec.unit === 'sec') return `${value}s`;
  if (spec.unit === 'reps') return `${value} reps`;
  return `${value} ${spec.unit}`;
}
// Legacy alias (still used in places that imported as formatPr).
export const formatPr = formatLog;
