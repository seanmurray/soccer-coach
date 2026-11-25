// History overview data: sessions + set tonnage within a date range, and
// every session date (for the calendar). Lightweight column selects; paged
// so "All" isn't cut off by PostgREST's default 1000-row cap.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const PAGE = 1000;
const MAX_PAGES = 20;

async function fetchAll(build) {
  const out = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    const { data, error } = await build().range(p * PAGE, p * PAGE + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

// start: 'YYYY-MM-DD' inclusive, or null for all time.
export function useHistoryRange(start) {
  return useQuery({
    queryKey: ['history_range', start ?? 'all'],
    enabled: !!supabase,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const withStart = (q) => (start ? q.gte('performed_at', start) : q);
      const [sessions, sets] = await Promise.all([
        fetchAll(() => withStart(supabase.from('soccer_sessions').select('id, performed_at, session_rpe').order('performed_at'))),
        fetchAll(() => withStart(supabase.from('soccer_sets').select('session_id, performed_at, actual_weight, actual_reps, unit').order('performed_at'))),
      ]);
      return { sessions, sets };
    },
  });
}

// Every logged session's date + id + day type, for the calendar.
export function useSessionDates() {
  return useQuery({
    queryKey: ['history_range', 'dates'],
    enabled: !!supabase,
    staleTime: 1000 * 60,
    queryFn: () => fetchAll(() =>
      supabase.from('soccer_sessions').select('id, performed_at, day_type').order('performed_at', { ascending: false })
    ),
  });
}
