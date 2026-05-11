// React Query hooks for session history.
//
// useSessions() — list view, returns recent soccer_sessions newest-first.
// useSessionDetail(id) — expanded view, returns sets + exercise_perf +
//   module_usage rows for one session in three parallel queries.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const SESSIONS_LIMIT = 50;

export function useSessions() {
  return useQuery({
    queryKey: ['soccer_sessions'],
    enabled: !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soccer_sessions')
        .select('*')
        .order('performed_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(SESSIONS_LIMIT);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSessionDetail(sessionId) {
  return useQuery({
    queryKey: ['soccer_session_detail', sessionId],
    enabled: !!supabase && !!sessionId,
    queryFn: async () => {
      const [sets, perf, modules] = await Promise.all([
        supabase
          .from('soccer_sets')
          .select('*')
          .eq('session_id', sessionId)
          .order('exercise_key', { ascending: true })
          .order('set_num', { ascending: true }),
        supabase
          .from('soccer_exercise_perf')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true }),
        supabase
          .from('soccer_module_usage')
          .select('*')
          .eq('session_id', sessionId)
          .order('opened_at', { ascending: true }),
      ]);

      const firstError = sets.error || perf.error || modules.error;
      if (firstError) throw firstError;

      return {
        sets: sets.data ?? [],
        exercisePerf: perf.data ?? [],
        moduleUsage: modules.data ?? [],
      };
    },
  });
}
