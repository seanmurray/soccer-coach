// Rolling 3-day CNS load. Pulls sessions + sets + perf in one batch and
// computes the budget per cnsBudget.js.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { computeCNSBudget } from '../lib/cnsBudget';
import { calibratedHRmax } from '../lib/hrZones';

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
      // days still register CNS load. Also grab the all-time observed max HR
      // to calibrate zone boundaries for the avg-HR fallback.
      const [sessRes, wkRes, maxRes] = await Promise.all([
        supabase.from('soccer_sessions').select('id, performed_at').gte('performed_at', sinceStr),
        supabase.from('soccer_workouts').select('id, performed_at, duration_sec, avg_hr, hr_zone_sec, session_id').gte('performed_at', sinceStr),
        supabase.from('soccer_workouts').select('max_hr').not('max_hr', 'is', null).order('max_hr', { ascending: false }).limit(1),
      ]);
      if (sessRes.error) throw sessRes.error;
      if (wkRes.error) throw wkRes.error;

      const observedMax = maxRes.data?.[0]?.max_hr;
      const hrMax = calibratedHRmax(observedMax != null ? [observedMax] : []);

      const ids = (sessRes.data ?? []).map((s) => s.id);
      if (ids.length === 0) {
        return computeCNSBudget({
          sessions: [],
          sets: [],
          perf: [],
          workouts: wkRes.data ?? [],
          hrMax,
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
        hrMax,
      });
    },
  });
}
