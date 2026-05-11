// Async debrief flow.
//
// Save Session writes the row immediately, then this module fires the AI
// debrief in the background and patches `soccer_sessions.ai_debrief` when the
// response arrives. The History query gets invalidated so the card auto-
// updates.
//
// Errors are surfaced to the History UI via debriefStore.errors so the user
// can see what went wrong and hit Retry instead of having to re-finish a
// whole session.

import { supabase } from './supabase';
import { askClaude } from './claudeProxy';
import { buildDebriefPrompt } from './prompts';
import { useDebriefStore } from '../stores/debriefStore';

export async function fireDebrief({
  sessionId,
  snapshot,
  postSession,
  queryClient,
}) {
  if (!sessionId) return;
  if (!supabase) {
    useDebriefStore.getState().markError(sessionId, 'Supabase not configured.');
    return;
  }

  const debriefStore = useDebriefStore.getState();
  debriefStore.markPending(sessionId);

  try {
    const { system, messages, maxTokens } = buildDebriefPrompt({
      ...snapshot,
      ...postSession,
    });
    const text = await askClaude({ system, messages, maxTokens });

    // `.select('id')` so we can verify the update actually hit a row. Without
    // this, an RLS-denied update returns { data: null, error: null } and we'd
    // think it succeeded when nothing changed.
    const { data: updated, error } = await supabase
      .from('soccer_sessions')
      .update({ ai_debrief: text })
      .eq('id', sessionId)
      .select('id');

    if (error) {
      const msg = `DB update failed: ${error.message ?? error}`;
      console.warn('[debrief]', msg);
      useDebriefStore.getState().markError(sessionId, msg);
      return;
    }
    if (!updated || updated.length === 0) {
      const msg = 'DB update affected 0 rows — likely an RLS policy is denying UPDATE on soccer_sessions.';
      console.warn('[debrief]', msg);
      useDebriefStore.getState().markError(sessionId, msg);
      return;
    }

    // Refresh the history list and the open detail card.
    queryClient?.invalidateQueries({ queryKey: ['soccer_sessions'] });
    queryClient?.invalidateQueries({ queryKey: ['soccer_session_detail', sessionId] });
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.warn('[debrief]', msg);
    useDebriefStore.getState().markError(sessionId, msg);
  } finally {
    useDebriefStore.getState().markDone(sessionId);
  }
}

// Re-runs a debrief for an existing session row. Reconstructs the prompt
// from session/sets/perf/module rows fetched fresh from Supabase.
export async function retryDebrief({ session, queryClient }) {
  console.log('[debrief retry] start', session?.id);
  if (!session?.id) { console.warn('[debrief retry] missing session id'); return; }
  if (!supabase)    { console.warn('[debrief retry] no supabase client'); return; }
  const sessionId = session.id;
  const debriefStore = useDebriefStore.getState();
  debriefStore.markPending(sessionId);

  try {
    console.log('[debrief retry] fetching rows for', sessionId);
    const [setsRes, perfRes, modRes] = await Promise.all([
      supabase.from('soccer_sets').select('*').eq('session_id', sessionId),
      supabase.from('soccer_exercise_perf').select('*').eq('session_id', sessionId),
      supabase.from('soccer_module_usage').select('*').eq('session_id', sessionId),
    ]);

    const firstError = setsRes.error || perfRes.error || modRes.error;
    if (firstError) throw firstError;

    const md = session.metadata ?? {};
    const { system, messages, maxTokens } = buildDebriefPrompt({
      rec: session.recovery_pct,
      slp: session.sleep_pct,
      body: session.body_feel,
      mot: session.motivation,
      battery: session.battery_pct,
      stress: session.stress_score,
      mode: session.mode,
      dayType: session.day_type,
      week: session.week_num,
      setsBuffer: setsRes.data ?? [],
      exercisePerfBuffer: perfRes.data ?? [],
      moduleUsageBuffer: modRes.data ?? [],
      warmupChecked: Array(md.warmup_checked_count ?? 0).fill(0),
      warmupTotal: md.warmup_total ?? 0,
      tabsVisited: md.tabs_visited ?? [],
      sessionStartedAt: md.session_started_at,
      sessionRpe: session.session_rpe,
      energy: session.energy,
    });

    console.log('[debrief retry] calling claude-proxy…');
    const text = await askClaude({ system, messages, maxTokens });
    console.log('[debrief retry] got text, length =', text?.length);

    const { data: updated, error } = await supabase
      .from('soccer_sessions')
      .update({ ai_debrief: text })
      .eq('id', sessionId)
      .select('id');

    if (error) throw error;
    if (!updated || updated.length === 0) {
      throw new Error('DB update affected 0 rows — likely an RLS policy is denying UPDATE on soccer_sessions.');
    }

    console.log('[debrief retry] DB updated, invalidating queries');
    queryClient?.invalidateQueries({ queryKey: ['soccer_sessions'] });
    queryClient?.invalidateQueries({ queryKey: ['soccer_session_detail', sessionId] });
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.warn('[debrief retry] FAILED:', msg, err);
    useDebriefStore.getState().markError(sessionId, msg);
  } finally {
    useDebriefStore.getState().markDone(sessionId);
  }
}
