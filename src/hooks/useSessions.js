// React Query hooks for session history.
//
// useSessions() — list view, returns recent soccer_sessions newest-first.
// useSessionDetail(id) — expanded view, returns sets + exercise_perf +
//   module_usage rows for one session in three parallel queries.
// useDeleteSession() — mutation that removes a session + its children.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

// Delete a session and its children. Child rows go first because of the
// session_id FK on soccer_sets / soccer_exercise_perf / soccer_module_usage.
// The final `.select('id')` lets us catch the case where RLS silently denied
// the delete — a successful Supabase response with zero rows means nothing
// was actually removed.
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId) => {
      const childTables = ['soccer_module_usage', 'soccer_exercise_perf', 'soccer_sets'];
      for (const table of childTables) {
        const { error } = await supabase.from(table).delete().eq('session_id', sessionId);
        if (error) throw error;
      }
      const { data, error } = await supabase
        .from('soccer_sessions')
        .delete()
        .eq('id', sessionId)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Session not deleted — RLS may have denied the operation.');
      }
      return sessionId;
    },
    onSuccess: (sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['soccer_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['soccer_session_detail', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['pr_timeline'] });
      queryClient.invalidateQueries({ queryKey: ['progress_series'] });
      queryClient.invalidateQueries({ queryKey: ['max_suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['acwr'] });
      queryClient.invalidateQueries({ queryKey: ['cns_budget'] });
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
