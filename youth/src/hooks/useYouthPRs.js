import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// All PR attempts, newest first. Best-per-move is derived client-side
// (lib/prs bestMap) so history is preserved for future charts.
export function useYouthPRs() {
  return useQuery({
    queryKey: ['youth_prs'],
    enabled: !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youth_prs')
        .select('*')
        .order('achieved_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}
