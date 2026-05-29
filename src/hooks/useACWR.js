// Pulls last 28 days of session rows + workout rows (from push-workout
// Shortcut ingestion), computes ACWR with both soccer-only and
// combined-with-cardio views.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { computeACWR } from '../lib/acwr';
import { calibratedHRmax } from '../lib/hrZones';

export function useACWR() {
  return useQuery({
    queryKey: ['acwr'],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      // LOCAL date (not UTC) for the 28-day lower bound, so the window edge
      // doesn't shift a day near midnight in negative-offset timezones.
      const since = new Date();
      since.setDate(since.getDate() - 28);
      const p = (n) => String(n).padStart(2, '0');
      const sinceStr = `${since.getFullYear()}-${p(since.getMonth() + 1)}-${p(since.getDate())}`;

      // Sessions + workouts (28d window) and the latest resting HR + the top
      // observed max HRs (for robust HRmax calibration) in parallel.
      const [sessRes, wkRes, rhrRes, maxRes] = await Promise.all([
        supabase
          .from('soccer_sessions')
          .select('id, performed_at, created_at, session_rpe, metadata')
          .gte('performed_at', sinceStr)
          .order('performed_at', { ascending: false }),
        supabase
          .from('soccer_workouts')
          .select('id, performed_at, duration_sec, avg_hr, hr_hist, hr_zone_sec, session_id')
          .gte('performed_at', sinceStr),
        supabase
          .from('soccer_biometrics')
          .select('rhr_bpm')
          .not('rhr_bpm', 'is', null)
          .order('recorded_at', { ascending: false })
          .limit(1),
        // Top maxes (not just the single highest) so calibratedHRmax can require
        // corroboration and reject a lone artifact spike.
        supabase
          .from('soccer_workouts')
          .select('max_hr')
          .not('max_hr', 'is', null)
          .order('max_hr', { ascending: false })
          .limit(10),
      ]);
      if (sessRes.error) throw sessRes.error;
      if (wkRes.error) throw wkRes.error;
      // rhr/max are best-effort context — don't fail the whole query on them.

      const restHr = rhrRes.data?.[0]?.rhr_bpm ?? undefined;
      const observedMaxes = (maxRes.data ?? []).map((r) => r.max_hr).filter((m) => m != null);
      const hrMax = calibratedHRmax(observedMaxes);

      return computeACWR({
        sessions: sessRes.data ?? [],
        workouts: wkRes.data ?? [],
        restHr,
        hrMax,
      });
    },
  });
}
