// useExerciseHistory(exerciseKey, kind, limit?)
//
// Returns the last N sessions for one exercise, shaped for inline rendering.
//
// kind = 'sets' — strength + build-with-SetTable. Queries soccer_sets,
//   groups rows by session_id (set-level data per session).
// kind = 'perf' — build feedback + conditioning. Queries
//   soccer_exercise_perf, one row per session (one feedback / measurement).
//
// Returns shape:
//   sets:  [{ sessionId, performedAt, sets: [{ set_num, actual_reps,
//             actual_weight, rpe }, ...] }, ...]
//   perf:  [{ sessionId, performedAt, exerciseName, quality, effortRpe,
//             ease, notes }, ...]

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const DEFAULT_LIMIT = 3;
// Generous over-fetch on sets: cover ~10 sets per session × N sessions.
const SETS_OVERFETCH = 30;

export function useExerciseHistory(exerciseKey, kind, limit = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: ['exercise_history', kind, exerciseKey, limit],
    enabled: !!supabase && !!exerciseKey && (kind === 'sets' || kind === 'perf'),
    queryFn: async () => {
      if (kind === 'sets') {
        const { data, error } = await supabase
          .from('soccer_sets')
          .select('session_id, performed_at, set_num, actual_reps, actual_weight, rpe')
          .eq('exercise_key', exerciseKey)
          .order('performed_at', { ascending: false })
          .order('set_num', { ascending: true })
          .limit(SETS_OVERFETCH);
        if (error) throw error;

        const grouped = new Map();
        for (const row of data ?? []) {
          let bucket = grouped.get(row.session_id);
          if (!bucket) {
            if (grouped.size >= limit) continue;
            bucket = { sessionId: row.session_id, performedAt: row.performed_at, sets: [] };
            grouped.set(row.session_id, bucket);
          }
          bucket.sets.push({
            set_num: row.set_num,
            actual_reps: row.actual_reps,
            actual_weight: row.actual_weight,
            rpe: row.rpe,
          });
        }
        return Array.from(grouped.values());
      }

      // kind === 'perf'
      const { data, error } = await supabase
        .from('soccer_exercise_perf')
        .select('session_id, performed_at, exercise_name, quality, effort_rpe, ease, notes')
        .eq('exercise_key', exerciseKey)
        .order('performed_at', { ascending: false })
        .limit(limit * 2);
      if (error) throw error;

      const seen = new Set();
      const out = [];
      for (const row of data ?? []) {
        if (seen.has(row.session_id)) continue;
        seen.add(row.session_id);
        out.push({
          sessionId: row.session_id,
          performedAt: row.performed_at,
          exerciseName: row.exercise_name,
          quality: row.quality,
          effortRpe: row.effort_rpe,
          ease: row.ease,
          notes: row.notes,
        });
        if (out.length >= limit) break;
      }
      return out;
    },
  });
}
