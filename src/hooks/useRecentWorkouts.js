// Recent workouts pushed in from HealthKit / Mywellness via the push-workout
// edge function. Listed on Today so they're visible immediately after a
// session ends and the Shortcut fires.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const DEFAULT_LIMIT = 5;

export function useRecentWorkouts(limit = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: ['recent_workouts', limit],
    enabled: !!supabase,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soccer_workouts')
        .select('id, source, workout_type, performed_at, started_at, duration_sec, distance_mi, avg_hr, max_hr, calories, hr_zone_sec, hrr_bpm, session_id')
        .order('started_at', { ascending: false, nullsFirst: false })
        .order('performed_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}
