// Aggregates per-metric time series for the Progress screen.
//
// Returns:
//   strengthSeries: { [liftKey]: [{ date, value, isPR, sessionId }] }
//   measureSeries:  { [exerciseKey]: { name, unit, points: [...same shape] } }
//   sessionRpeSeries: [{ date, value }]
//
// `isPR` marks the first occurrence of a new all-time best on this metric —
// chart highlights these in amber. Matches the PR detection in lib/prs.js.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { estimate1RM } from '../lib/maxEstimator';
import { parseMeasurement } from '../lib/measurementParse';
import { EX_TO_MAX_KEY } from '../data/exercises';

export function useProgressSeries() {
  return useQuery({
    queryKey: ['progress_series'],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Sessions provide the date stamp; fetch sets/perf in parallel.
      const [sessRes, setsRes, perfRes] = await Promise.all([
        supabase.from('soccer_sessions').select('id, performed_at, session_rpe').order('performed_at', { ascending: true }),
        supabase.from('soccer_sets').select('session_id, exercise_key, exercise_name, actual_reps, actual_weight, rpe'),
        supabase.from('soccer_exercise_perf').select('session_id, exercise_key, exercise_name, notes'),
      ]);
      const firstError = sessRes.error || setsRes.error || perfRes.error;
      if (firstError) throw firstError;

      const sessionsById = new Map((sessRes.data ?? []).map((s) => [s.id, s]));

      // ── e1RM per main lift, per session (best set in the session) ─────
      const strengthByLiftByDate = {}; // liftKey -> sessionId -> bestE1RM
      for (const s of setsRes.data ?? []) {
        const liftKey = EX_TO_MAX_KEY[s.exercise_key];
        if (!liftKey) continue;
        const w = Number(s.actual_weight);
        const r = Number(s.actual_reps);
        const rpe = Number(s.rpe);
        if (!w || !r) continue;
        const e1 = estimate1RM(w, r, rpe);
        if (!Number.isFinite(e1)) continue;
        const bucket = (strengthByLiftByDate[liftKey] ??= {});
        if (!bucket[s.session_id] || e1 > bucket[s.session_id].value) {
          bucket[s.session_id] = { value: e1, name: s.exercise_name };
        }
      }

      const strengthSeries = {};
      for (const [liftKey, byId] of Object.entries(strengthByLiftByDate)) {
        const points = Object.entries(byId).map(([sessionId, v]) => ({
          sessionId,
          date: sessionsById.get(sessionId)?.performed_at ?? '',
          value: Math.round(v.value),
          name: v.name,
        })).filter((p) => p.date);
        points.sort((a, b) => (a.date < b.date ? -1 : 1));
        markPRs(points);
        strengthSeries[liftKey] = points;
      }

      // ── Measurements per exercise, per session ───────────────────────
      const measureByExByDate = {}; // exKey -> sessionId -> { value, unit, name }
      for (const p of perfRes.data ?? []) {
        const m = parseMeasurement(p.notes);
        if (!m) continue;
        const bucket = (measureByExByDate[p.exercise_key] ??= {});
        // If multiple rows in same session, keep the max.
        if (!bucket[p.session_id] || m.value > bucket[p.session_id].value) {
          bucket[p.session_id] = { value: m.value, unit: m.unit, name: p.exercise_name };
        }
      }

      const measureSeries = {};
      for (const [exKey, byId] of Object.entries(measureByExByDate)) {
        const points = Object.entries(byId).map(([sessionId, v]) => ({
          sessionId,
          date: sessionsById.get(sessionId)?.performed_at ?? '',
          value: v.value,
        })).filter((p) => p.date);
        points.sort((a, b) => (a.date < b.date ? -1 : 1));
        markPRs(points);
        const first = Object.values(byId)[0];
        measureSeries[exKey] = { name: first.name, unit: first.unit, points };
      }

      // ── Session RPE over time — for overall load trending ─────────────
      const sessionRpeSeries = (sessRes.data ?? [])
        .filter((s) => s.session_rpe != null && s.performed_at)
        .map((s) => ({ date: s.performed_at, value: Number(s.session_rpe), sessionId: s.id }));

      return { strengthSeries, measureSeries, sessionRpeSeries };
    },
  });
}

// Walks a date-sorted point array and flips isPR=true on each new running max.
function markPRs(points) {
  let best = -Infinity;
  for (const p of points) {
    if (p.value > best) {
      p.isPR = true;
      best = p.value;
    } else {
      p.isPR = false;
    }
  }
}
