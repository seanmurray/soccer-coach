// Rolling 3-day CNS load. Pulls sessions + sets + perf in one batch and
// computes the budget per cnsBudget.js.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { computeCNSBudget } from '../lib/cnsBudget';

export function useCNSBudget() {
  return useQuery({
    queryKey: ['cns_budget'],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // Pull last 5 days so the window-edge logic in computeCNSBudget can
      // filter precisely without missing rows at the cutoff.
      const since = new Date();
      since.setDate(since.getDate() - 5);
      const sinceStr = since.toISOString().slice(0, 10);

      // Sessions + workouts in parallel — both feed the CNS calculation.
      // Workouts pull in even when there are zero sessions so cardio-only
      // days still register CNS load.
      const [sessRes, wkRes] = await Promise.all([
        supabase.from('soccer_sessions').select('id, performed_at').gte('performed_at', sinceStr),
        supabase.from('soccer_workouts').select('id, performed_at, duration_sec, avg_hr').gte('performed_at', sinceStr),
      ]);
      if (sessRes.error) throw sessRes.error;
      if (wkRes.error) throw wkRes.error;

      const ids = (sessRes.data ?? []).map((s) => s.id);
      if (ids.length === 0) {
        return computeCNSBudget({
          sessions: [],
          sets: [],
          perf: [],
          workouts: wkRes.data ?? [],
        });
      }

      const [setsRes, perfRes] = await Promise.all([
        supabase.from('soccer_sets').select('session_id, rpe').in('session_id', ids),
        supabase.from('soccer_exercise_perf').select('session_id, exercise_type, effort_rpe, notes').in('session_id', ids),
      ]);
      const firstError = setsRes.error || perfRes.error;
      if (firstError) throw firstError;

      return computeCNSBudget({
        sessions: sessRes.data ?? [],
        sets: setsRes.data ?? [],
        perf: perfRes.data ?? [],
        workouts: wkRes.data ?? [],
      });
    },
  });
}
