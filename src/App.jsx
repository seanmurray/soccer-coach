import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { BottomNav } from './components/BottomNav';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryHubScreen } from './screens/HistoryHubScreen';
import { ExercisesScreen } from './screens/ExercisesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RestTimer } from './components/RestTimer';
import { ModuleSheet } from './components/ModuleSheet';
import { ReadinessBaselineSync } from './components/ReadinessBaselineSync';
import { useSessionStore } from './stores/sessionStore';
import { useSwapsStore } from './stores/swapsStore';
import { useSlotStore } from './stores/slotStore';
import { useUpgradesStore } from './stores/upgradesStore';
import { saveSession } from './lib/saveSession';
import { fireDebrief } from './lib/debrief';
import { WARMUP, FRC_SHORT, FRC_FULL } from './data/frc';

// Persist the active bottom-nav tab across reloads. Mobile Chrome aggressively
// suspends backgrounded tabs and reloads them on return — without this, the
// user always lands on the Dashboard even if they were mid-workout. Sub-tab and
// in-flight buffers are persisted separately (sessionStore + WorkoutScreen).
const TAB_KEY = 'soccer-coach-tab';
const VALID_TABS = ['dashboard', 'workout', 'history', 'exercises', 'settings'];
// Tabs from the pre-redesign 6-tab bar → where that content lives now.
// 'progress' also flips the History segment so the user lands on the charts.
const LEGACY_TABS = { today: 'dashboard', load: 'dashboard', progress: 'history' };
function readPersistedTab() {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v === 'progress') localStorage.setItem('soccer-coach-history-seg', 'progress');
    const mapped = LEGACY_TABS[v] ?? v;
    return VALID_TABS.includes(mapped) ? mapped : 'dashboard';
  } catch {
    return 'dashboard';
  }
}

export default function App() {
  const [tab, setTab] = useState(readPersistedTab);
  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* ignore */ }
  }, [tab]);

  const [moduleIndex, setModuleIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  // Summary of the session that was just saved (not persisted — a reload
  // simply drops you back on the day overview).
  const [summary, setSummary] = useState(null);

  const startSession = useSessionStore((s) => s.startSession);
  const resetSession = useSessionStore((s) => s.resetSession);
  const markSessionEnd = useSessionStore((s) => s.markSessionEnd);
  const setStage = useSessionStore((s) => s.setStage);
  const clearSwaps = useSwapsStore((s) => s.clear);
  const clearTodaySlots = useSlotStore((s) => s.clearToday);
  const clearUpgrades = useUpgradesStore((s) => s.clear);

  // Snapshot for save() — pulled lazily to avoid re-rendering the App on every
  // store change. warmupChecked / tabsVisited go into soccer_sessions.metadata
  // (jsonb) so the History screen and any future AI debrief have the full
  // session shape.
  const getSnapshot = () => {
    const s = useSessionStore.getState();
    return {
      rec: s.rec, body: s.body, mot: s.mot, battery: s.battery, stress: s.stress,
      mode: s.mode, dayType: s.dayType, week: s.week,
      setsBuffer: s.setsBuffer,
      exercisePerfBuffer: s.exercisePerfBuffer,
      moduleUsageBuffer: s.moduleUsageBuffer,
      warmupChecked: s.warmupChecked,
      warmupTotal: WARMUP.length,
      frcShortChecked: s.frcShortChecked,
      frcShortTotal: FRC_SHORT.length,
      frcFullChecked: s.frcFullChecked,
      frcFullTotal: FRC_FULL.length,
      tabsVisited: s.tabsVisited,
      sessionStartedAt: s.sessionStartedAt,
      sessionEndedAt: s.sessionEndedAt,
    };
  };

  // Dashboard CTA → the Workout tab's day overview.
  const goToWorkout = () => setTab('workout');

  // Start Workout on the day overview. Today-scope swaps are NOT cleared here
  // any more: you pick them on the overview right before starting. They're
  // in-memory only and get cleared on save / cancel.
  const handleStart = () => {
    startSession();
    clearUpgrades();
  };

  const clearInFlight = () => {
    resetSession();
    clearSwaps();
    clearTodaySlots();
    clearUpgrades();
  };

  // Cancel Workout — throws away everything logged this session.
  const handleCancel = () => {
    const logged = useSessionStore.getState().setsBuffer.length;
    const msg = logged > 0
      ? `Cancel this workout? The ${logged} set${logged === 1 ? '' : 's'} you logged will be discarded.`
      : 'Cancel this workout?';
    if (window.confirm(msg)) clearInFlight();
  };

  // Back from the warm-up = never mind, don't start.
  const handleAbandonStart = () => {
    if (window.confirm('Leave the warm-up? The workout won’t be started.')) clearInFlight();
  };

  // Finish Workout → the Workout Complete step. Stamp the session-end time
  // NOW (workout is done) so it isn't conflated with however long the
  // Workout Complete form stays open before save.
  const handleFinish = () => {
    if (saving) return;
    markSessionEnd();
    setStage('complete');
  };

  // Complete Workout — save + fire debrief, then show the summary.
  const handleConfirmFinish = async ({ sessionRpe, energy, minutes, allSets, achievement, improvement }) => {
    if (saving) return;
    setSaving(true);
    const snapshot = getSnapshot();
    const st = useSessionStore.getState();
    // Edited workout length → move the end stamp so duration-based load
    // (and the History length) use the corrected number.
    if (minutes && snapshot.sessionStartedAt) {
      snapshot.sessionEndedAt = new Date(new Date(snapshot.sessionStartedAt).getTime() + minutes * 60000).toISOString();
    }
    const extras = {
      readiness_score: Math.round(st.score),
      focus: st.checkin.focus,
      focus_custom: st.checkin.focus === 'custom' ? st.checkin.focusCustom || null : null,
      injury_rehab: st.checkin.injuryRehab,
      all_sets_completed: allSets,
      achievement: achievement || null,
      improvement: improvement || null,
      duration_edited: !!minutes,
    };
    const result = await saveSession({ ...snapshot, sessionRpe, energy, extras });
    setSaving(false);
    if (!result.ok) {
      alert('Save failed: ' + (result.error?.message ?? 'unknown error'));
      return;
    }

    // Refresh the History list + PR / progression queries so the new row,
    // PR badges, and chart points all show up immediately.
    queryClient.invalidateQueries({ queryKey: ['soccer_sessions'] });
    queryClient.invalidateQueries({ queryKey: ['pr_timeline'] });
    queryClient.invalidateQueries({ queryKey: ['progress_series'] });
    queryClient.invalidateQueries({ queryKey: ['max_suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['acwr'] });
    queryClient.invalidateQueries({ queryKey: ['cns_budget'] });
    queryClient.invalidateQueries({ queryKey: ['sprint_exposure'] });
    queryClient.invalidateQueries({ queryKey: ['readiness_baseline'] });
    queryClient.invalidateQueries({ queryKey: ['recent_workouts'] });
    queryClient.invalidateQueries({ queryKey: ['history_range'] });
    queryClient.invalidateQueries({ queryKey: ['week_status'] });

    // Fire the debrief in the background — non-blocking. When it returns
    // it updates ai_debrief on the row and invalidates queries again so
    // the open detail card refreshes.
    fireDebrief({
      sessionId: result.sessionId,
      snapshot,
      postSession: { sessionRpe, energy },
      queryClient,
    });

    const lengthMin = snapshot.sessionStartedAt && snapshot.sessionEndedAt
      ? Math.max(1, Math.round((new Date(snapshot.sessionEndedAt) - new Date(snapshot.sessionStartedAt)) / 60000))
      : null;
    setSummary({
      snapshot, sessionRpe, energy, achievement, improvement,
      minutes: lengthMin,
      readinessScore: st.score,
    });
    clearInFlight();
  };

  // Render every screen and toggle visibility with `hidden`. Keeping mounted
  // preserves local state — your in-progress SetTable rows survive a quick
  // hop to the History tab and back, and likewise the inner Workout sub-tabs
  // (warmup/agility/etc.) keep their state.
  return (
    <QueryClientProvider client={queryClient}>
      <ReadinessBaselineSync />
      <div hidden={tab !== 'dashboard'}>
        <TodayScreen onStartSession={goToWorkout} />
      </div>
      <div hidden={tab !== 'workout'}>
        <WorkoutScreen
          onStart={handleStart}
          onFinish={handleFinish}
          onCancel={handleCancel}
          onAbandonStart={handleAbandonStart}
          onConfirmFinish={handleConfirmFinish}
          saving={saving}
          summary={summary}
          onCloseSummary={() => setSummary(null)}
          onOpenHistory={() => { setSummary(null); setTab('history'); }}
        />
      </div>
      <div hidden={tab !== 'history'}>
        <HistoryHubScreen />
      </div>
      <div hidden={tab !== 'exercises'}>
        <ExercisesScreen onOpenModule={(i) => setModuleIndex(i)} />
      </div>
      <div hidden={tab !== 'settings'}>
        <SettingsScreen />
      </div>

      <RestTimer />
      <ModuleSheet moduleIndex={moduleIndex} onClose={() => setModuleIndex(null)} />
      <BottomNav active={tab} onChange={setTab} />
    </QueryClientProvider>
  );
}
