import styles from './LoadScreen.module.css';
import { ACWRCard } from '../components/ACWRCard';
import { CNSBudgetCard } from '../components/CNSBudgetCard';
import { SprintExposureCard } from '../components/SprintExposureCard';
import { RecentWorkoutsCard } from '../components/RecentWorkoutsCard';
import { useACWR } from '../hooks/useACWR';
import { useCNSBudget } from '../hooks/useCNSBudget';
import { useSprintExposure } from '../hooks/useSprintExposure';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';

// Load — the training-analytics hub. Everything that answers "how much have I
// been doing and how recovered am I?" lives here, off the Today decision flow:
//   • Training load (ACWR)      • CNS budget (neural fatigue)
//   • Sprint exposure           • Recent workouts (HealthKit ingest)
//
// Each card self-hides when it has no data; if ALL are empty we show a single
// empty state instead of a blank screen.
export function LoadScreen() {
  const acwr = useACWR();
  const cns = useCNSBudget();
  const sprint = useSprintExposure();
  const workouts = useRecentWorkouts(5);

  const anyLoading = acwr.isLoading || cns.isLoading || sprint.isLoading || workouts.isLoading;

  // Mirror each card's own visibility rule so we know whether the screen is
  // effectively empty (and avoid a lonely title over nothing).
  const hasACWR = !!acwr.data && !(acwr.data.zone === 'idle' && acwr.data.samples < 2);
  const hasCNS = !!cns.data && ((cns.data.sessionCount ?? 0) > 0 || (cns.data.workoutCount ?? 0) > 0);
  const hasSprint = !!sprint.data && sprint.data.sessionCount > 0;
  const hasWorkouts = !!workouts.data && workouts.data.length > 0;
  const isEmpty = !anyLoading && !hasACWR && !hasCNS && !hasSprint && !hasWorkouts;

  return (
    <main className="screen">
      <div className="title-xl" style={{ marginBottom: 6 }}>Load</div>
      <div className={styles.subtitle}>Training load, recovery &amp; recent activity</div>

      {anyLoading && (
        <div className={styles.loading}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      )}

      {isEmpty ? (
        <div className={styles.empty}>
          <strong>Nothing to show yet.</strong>
          <div style={{ marginTop: 8 }}>
            Log a session or sync an Apple Watch workout and your training-load,
            CNS, sprint-exposure, and recent-workout cards will appear here.
          </div>
        </div>
      ) : (
        <>
          <ACWRCard />
          <CNSBudgetCard />
          <SprintExposureCard />
          <RecentWorkoutsCard />
        </>
      )}
    </main>
  );
}
