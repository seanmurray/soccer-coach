import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Recent finished sessions, newest first. Drives the Streak/History screen.
export function useYouthSessions() {
  return useQuery({
    queryKey: ['youth_sessions'],
    enabled: !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youth_sessions')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(120);
      if (error) throw error;
      return data ?? [];
    },
  });
}
