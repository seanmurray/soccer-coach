// Pulls last 28 days of session rows + workout rows (from push-workout
// Shortcut ingestion), computes ACWR with both soccer-only and
// combined-with-cardio views.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { computeACWR } from '../lib/acwr';

export function useACWR() {
  return useQuery({
    queryKey: ['acwr'],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 28);
      const sinceStr = since.toISOString().slice(0, 10);

      // Sessions and workouts in parallel — same date window.
      const [sessRes, wkRes] = await Promise.all([
        supabase
          .from('soccer_sessions')
          .select('id, performed_at, created_at, session_rpe, metadata')
          .gte('performed_at', sinceStr)
          .order('performed_at', { ascending: false }),
        supabase
          .from('soccer_workouts')
          .select('id, performed_at, duration_sec, avg_hr')
          .gte('performed_at', sinceStr),
      ]);
      if (sessRes.error) throw sessRes.error;
      if (wkRes.error) throw wkRes.error;

      return computeACWR({
        sessions: sessRes.data ?? [],
        workouts: wkRes.data ?? [],
      });
    },
  });
}
