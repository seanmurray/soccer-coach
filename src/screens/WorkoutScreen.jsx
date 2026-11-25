import { useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { DayOverview } from './workout/DayOverview';
import { WarmupStep } from './workout/WarmupStep';
import { ReadinessStep } from './workout/ReadinessStep';
import { ActiveWorkout } from './workout/ActiveWorkout';
import { WorkoutComplete } from './workout/WorkoutComplete';
import { WorkoutSummary } from './workout/WorkoutSummary';

// Workout tab = a guided flow, one step at a time:
//   overview → warmup → readiness (check-in) → active → complete → summary
// The current step is persisted in the session store so a reload (or a
// swipe away to another app) lands you right back where you were.
export function WorkoutScreen({
  onStart, onFinish, onCancel, onAbandonStart,
  onConfirmFinish, saving, summary, onCloseSummary, onOpenHistory,
}) {
  const stage = useSessionStore((s) => s.stage);
  const setStage = useSessionStore((s) => s.setStage);

  // Each step starts at the top.
  useEffect(() => { window.scrollTo(0, 0); }, [stage, summary]);

  if (summary) {
    return <WorkoutSummary summary={summary} onDone={onCloseSummary} onOpenHistory={onOpenHistory} />;
  }

  switch (stage) {
    case 'warmup':
      return <WarmupStep onBack={onAbandonStart} />;
    case 'readiness':
      return <ReadinessStep onBack={() => setStage('warmup')} />;
    case 'complete':
      return <WorkoutComplete saving={saving} onConfirm={onConfirmFinish} />;
    case 'active':
      return <ActiveWorkout onFinish={onFinish} onCancel={onCancel} />;
    case 'overview':
    default:
      return <DayOverview onStart={onStart} />;
  }
}
