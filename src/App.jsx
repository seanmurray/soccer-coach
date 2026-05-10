import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { BottomNav } from './components/BottomNav';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useSessionStore } from './stores/sessionStore';

export default function App() {
  const [tab, setTab] = useState('today');
  const startSession = useSessionStore((s) => s.startSession);
  const resetSession = useSessionStore((s) => s.resetSession);

  const handleStart = () => {
    startSession();
    setTab('workout');
  };

  const handleFinish = () => {
    // TODO(next pass): write soccer_sessions + soccer_sets + soccer_exercise_perf
    // + soccer_module_usage rows, then trigger AI debrief.
    resetSession();
    setTab('today');
  };

  return (
    <QueryClientProvider client={queryClient}>
      {tab === 'today'    && <TodayScreen onStartSession={handleStart} onOpenModule={() => { /* module sheet — next pass */ }} />}
      {tab === 'workout'  && <WorkoutScreen onFinish={handleFinish} />}
      {tab === 'history'  && <HistoryScreen />}
      {tab === 'settings' && <SettingsScreen />}
      <BottomNav active={tab} onChange={setTab} />
    </QueryClientProvider>
  );
}
