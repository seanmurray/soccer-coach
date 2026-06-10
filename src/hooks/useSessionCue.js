// Session cue — fired once per session start.
//
// Keyed on `sessionStartedAt` so the cue regenerates each Start Session, but
// not on every workout-screen render or readiness change. If the call fails
// or the user has no Supabase config, falls back to MODE_INSIGHTS.

import { useQuery } from '@tanstack/react-query';
import { askClaude } from '../lib/claudeProxy';
import { buildSessionCuePrompt } from '../lib/prompts';
import { MODE_INSIGHTS } from '../data/sessions';

export function useSessionCue({
  sessionStartedAt,
  rec, body, mot, battery, stress,
  mode, dayType, week,
}) {
  const fallback = MODE_INSIGHTS[mode]?.[dayType] ?? '';

  const result = useQuery({
    queryKey: ['session_cue', sessionStartedAt, mode, dayType, week],
    enabled: !!sessionStartedAt,
    staleTime: Infinity, // Don't regenerate within a session.
    gcTime: 1000 * 60 * 30,
    retry: 0,
    queryFn: async () => {
      const { system, messages, maxTokens } = buildSessionCuePrompt({
        rec, body, mot, battery, stress,
        mode, dayType, week,
      });
      return askClaude({ system, messages, maxTokens });
    },
  });

  return {
    cue: result.data,
    fallback,
    isLoading: result.isLoading && !!sessionStartedAt,
    error: result.error,
  };
}
