import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ATHLETE } from '../config/athlete';

// Recent finished sessions for the current athlete, newest first. Drives the
// Streak/History screen. Filtered by athlete_id so each sibling app only sees
// its own data.
export function useYouthSessions() {
  return useQuery({
    queryKey: ['youth_sessions', ATHLETE.id],
    enabled: !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youth_sessions')
        .select('*')
        .eq('athlete_id', ATHLETE.id)
        .order('performed_at', { ascending: false })
        .limit(120);
      if (error) throw error;
      return data ?? [];
    },
  });
}
