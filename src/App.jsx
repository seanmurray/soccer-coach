import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { BottomNav } from './components/BottomNav';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { RestTimer } from './components/RestTimer';
import { ModuleSheet } from './components/ModuleSheet';
import { PostSessionSheet } from './components/PostSessionSheet';
import { useSessionStore } from './stores/sessionStore';
import { useSwapsStore } from './stores/swapsStore';
import { useUpgradesStore } from './stores/upgradesStore';
import { saveSession } from './lib/saveSession';
import { fireDebrief } from './lib/debrief';
import { WARMUP, FRC_SHORT, FRC_FULL } from './data/frc';

export default function App() {
  const [tab, setTab] = useState('today');
  const [moduleIndex, setModuleIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  // Post-session sheet: shown after Finish Session is tapped, captures RPE
  // + energy, confirms or cancels the save.
  const [finishSheetOpen, setFinishSheetOpen] = useState(false);

  const startSession = useSessionStore((s) => s.startSession);
  const resetSession = useSessionStore((s) => s.resetSession);
  const clearSwaps = useSwapsStore((s) => s.clear);
  const clearUpgrades = useUpgradesStore((s) => s.clear);

  // Snapshot for save() — pulled lazily to avoid re-rendering the App on every
  // store change. warmupChecked / tabsVisited go into soccer_sessions.metadata
  // (jsonb) so the History screen and any future AI debrief have the full
  // session shape.
  const getSnapshot = () => {
    const s = useSessionStore.getState();
    return {
      rec: s.rec, slp: s.slp, body: s.body, mot: s.mot, battery: s.battery, stress: s.stress,
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
    };
  };

  const handleStart = () => {
    startSession();
    clearSwaps();
    clearUpgrades();
    setTab('workout');
  };

  // Finish Session button on the Workout screen — open the post-session sheet.
  const handleFinish = () => {
    if (saving) return;
    setFinishSheetOpen(true);
  };

  // Confirm from the post-session sheet — save + fire debrief.
  const handleConfirmFinish = async ({ sessionRpe, energy }) => {
    if (saving) return;
    setSaving(true);
    const snapshot = getSnapshot();
    const result = await saveSession({ ...snapshot, sessionRpe, energy });
    setSaving(false);
    if (!result.ok) {
      alert('Save failed: ' + (result.error?.message ?? 'unknown error'));
      return;
    }
    setFinishSheetOpen(false);

    // Refresh the History list so the new row shows up immediately.
    queryClient.invalidateQueries({ queryKey: ['soccer_sessions'] });

    // Fire the debrief in the background — non-blocking. When it returns
    // it updates ai_debrief on the row and invalidates queries again so
    // the open detail card refreshes.
    fireDebrief({
      sessionId: result.sessionId,
      snapshot,
      postSession: { sessionRpe, energy },
      queryClient,
    });

    resetSession();
    clearSwaps();
    clearUpgrades();
    setTab('history');
  };

  return (
    <QueryClientProvider client={queryClient}>
      {tab === 'today'    && <TodayScreen onStartSession={handleStart} onOpenModule={(i) => setModuleIndex(i)} />}
      {tab === 'workout'  && <WorkoutScreen onFinish={handleFinish} />}
      {tab === 'history'  && <HistoryScreen />}
      {tab === 'settings' && <SettingsScreen />}

      <RestTimer />
      <ModuleSheet moduleIndex={moduleIndex} onClose={() => setModuleIndex(null)} />
      <PostSessionSheet
        open={finishSheetOpen}
        saving={saving}
        onCancel={() => setFinishSheetOpen(false)}
        onConfirm={handleConfirmFinish}
      />
      <BottomNav active={tab} onChange={setTab} />
    </QueryClientProvider>
  );
}
