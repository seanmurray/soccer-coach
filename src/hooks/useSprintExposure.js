// Rolling sprint-exposure window. Pulls last 14 days of sessions + their
// conditioning perf rows so we can show "days since last" beyond the 7-day
// dose window.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { computeSprintExposure } from '../lib/sprintExposure';

export function useSprintExposure() {
  return useQuery({
    queryKey: ['sprint_exposure'],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceStr = since.toISOString().slice(0, 10);

      const sessRes = await supabase
        .from('soccer_sessions')
        .select('id, performed_at, day_type')
        .gte('performed_at', sinceStr);
      if (sessRes.error) throw sessRes.error;

      const sessions = sessRes.data ?? [];
      const ids = sessions.map((s) => s.id);
      if (ids.length === 0) {
        return computeSprintExposure({ sessions: [], perf: [] });
      }

      const perfRes = await supabase
        .from('soccer_exercise_perf')
        .select('session_id, exercise_key')
        .in('session_id', ids);
      if (perfRes.error) throw perfRes.error;

      return computeSprintExposure({ sessions, perf: perfRes.data ?? [] });
    },
  });
}
