// Pulls last 28 days of session rows, computes ACWR.

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

      const { data, error } = await supabase
        .from('soccer_sessions')
        .select('id, performed_at, created_at, session_rpe, metadata')
        .gte('performed_at', sinceStr)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return computeACWR(data ?? []);
    },
  });
}
