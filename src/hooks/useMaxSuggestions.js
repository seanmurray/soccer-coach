// Queries recent strength sets and computes per-lift max suggestions.
//
// Scope: last 21 days of sets — long enough to capture 3-4 strength sessions
// per lift, short enough that we're not weighting stale data.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { buildMaxSuggestions } from '../lib/maxEstimator';
import { useSettingsStore } from '../stores/settingsStore';

const RECENT_DAYS = 21;

export function useMaxSuggestions() {
  const maxes = useSettingsStore((s) => s.maxes);

  return useQuery({
    queryKey: ['max_suggestions', maxes.trapbar, maxes.bench, maxes.blgsq, maxes.bsq],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 10, // 10 min
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - RECENT_DAYS);
      const sinceStr = since.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('soccer_sets')
        .select('session_id, exercise_key, actual_reps, actual_weight, rpe, performed_at')
        .gte('performed_at', sinceStr)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return buildMaxSuggestions(data ?? [], maxes);
    },
  });
}
