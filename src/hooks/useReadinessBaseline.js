// Rolling personal baseline for the autonomic readiness markers (battery,
// stress from Athlytic). Feeds computeMode so today's reading is scored as a
// deviation from YOUR norm, not an absolute number (HRV-monitoring evidence:
// rolling baseline + variability beats isolated point readings).
//
// Uses the most recent N non-null values within the last 21 days. Requires a
// minimum sample count; otherwise that metric's baseline is null and
// computeMode falls back to absolute scoring for it.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const LOOKBACK_DAYS = 21;
const MAX_SAMPLES = 10;
const MIN_SAMPLES = 4;

function stats(values) {
  if (values.length < MIN_SAMPLES) return null;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return { mean, sd: Math.sqrt(variance), n };
}

export function useReadinessBaseline() {
  return useQuery({
    queryKey: ['readiness_baseline'],
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - LOOKBACK_DAYS);
      const sinceStr = since.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('soccer_sessions')
        .select('performed_at, battery_pct, stress_score')
        .gte('performed_at', sinceStr)
        .order('performed_at', { ascending: false });
      if (error) throw error;

      const rows = data ?? [];
      const take = (field) =>
        rows
          .map((r) => r[field])
          .filter((v) => v != null && Number.isFinite(Number(v)))
          .slice(0, MAX_SAMPLES)
          .map(Number);

      return {
        battery: stats(take('battery_pct')),
        stress: stats(take('stress_score')),
      };
    },
  });
}
