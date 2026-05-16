// Week-completion data layer.
//
// useWeekStatus(week)   — which required days (acc/lat/lin/vel; cond is NOT
//   required) have a logged session for this week, plus the auto-computed
//   upper/lower-body RPE averages from the week's strength/build sets.
// useWeekCompletions()  — past completed weeks (History "Week log").
// useCompleteWeek()     — upsert a completion row (one per week_num).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { weeklyRegionRpe } from '../lib/exerciseRegion';

export const REQUIRED_DAYS = ['acc', 'lat', 'lin', 'vel'];

export function useWeekStatus(week) {
  return useQuery({
    queryKey: ['week_status', week],
    enabled: !!supabase && Number.isFinite(week),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const [sessRes, setsRes] = await Promise.all([
        supabase
          .from('soccer_sessions')
          .select('day_type')
          .eq('week_num', week),
        supabase
          .from('soccer_sets')
          .select('exercise_key, rpe')
          .eq('week_num', week),
      ]);
      if (sessRes.error) throw sessRes.error;
      if (setsRes.error) throw setsRes.error;

      const daysLogged = new Set((sessRes.data ?? []).map((s) => s.day_type));
      const requiredDone = Object.fromEntries(
        REQUIRED_DAYS.map((d) => [d, daysLogged.has(d)])
      );
      const missing = REQUIRED_DAYS.filter((d) => !requiredDone[d]);
      const { avgUpperRpe, avgLowerRpe } = weeklyRegionRpe(setsRes.data ?? []);

      return {
        requiredDone,
        missing,
        allDone: missing.length === 0,
        condDone: daysLogged.has('cond'),
        avgUpperRpe,
        avgLowerRpe,
      };
    },
  });
}

export function useWeekCompletions() {
  return useQuery({
    queryKey: ['week_completions'],
    enabled: !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soccer_week_completions')
        .select('*')
        .order('week_num', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCompleteWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row) => {
      // One row per week_num — re-completing replaces the prior entry.
      const { data, error } = await supabase
        .from('soccer_week_completions')
        .upsert(row, { onConflict: 'week_num' })
        .select('week_num');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Week not saved — RLS may have denied the operation.');
      }
      return data[0];
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['week_completions'] });
      queryClient.invalidateQueries({ queryKey: ['week_status', vars?.week_num] });
    },
  });
}
