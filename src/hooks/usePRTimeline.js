// Pulls all-time strength sets + exercise feedback for the user and computes
// per-session PR timeline. Used by HistoryScreen to badge sessions and by
// the ProgressScreen to plot bests over time.
//
// Cached for 5 min — PRs only change after a Finish Session, and we already
// invalidate the History queries on save. Could trigger an explicit
// invalidate on save to be tighter; for now stale-time 5m + sessions-list
// invalidation is enough.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { buildPRTimeline } from '../lib/prs';

export function usePRTimeline() {
  return useQuery({
    queryKey: ['pr_timeline'],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // 1. session order (oldest first) — needed to walk PRs forward in time
      const sessRes = await supabase
        .from('soccer_sessions')
        .select('id, performed_at, created_at')
        .order('performed_at', { ascending: true })
        .order('created_at', { ascending: true });
      if (sessRes.error) throw sessRes.error;
      const sessionsOrder = (sessRes.data ?? []).map((s) => s.id);

      if (sessionsOrder.length === 0) {
        return { e1rmPRs: {}, measurePRs: {}, sessionsOrder };
      }

      // 2. all sets + perf rows in one shot. Could grow large eventually;
      //    fine until the user has thousands of sets.
      const [setsRes, perfRes] = await Promise.all([
        supabase
          .from('soccer_sets')
          .select('session_id, exercise_key, exercise_name, actual_reps, actual_weight, rpe'),
        supabase
          .from('soccer_exercise_perf')
          .select('session_id, exercise_key, exercise_name, notes'),
      ]);
      if (setsRes.error) throw setsRes.error;
      if (perfRes.error) throw perfRes.error;

      const timeline = buildPRTimeline({
        sets: setsRes.data ?? [],
        perf: perfRes.data ?? [],
        sessionsOrder,
      });
      return { ...timeline, sessionsOrder };
    },
  });
}
