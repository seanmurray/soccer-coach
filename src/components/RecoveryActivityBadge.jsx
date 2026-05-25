import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { zoneOf } from '../lib/hrZones';

// Small compact indicator that shows up on Today when a recovery-zone
// workout (Z1/Z2 — yoga, light walking, easy bike) was logged today or
// yesterday. Informational only — no readiness-score adjustment yet.
// Sits between the readiness rings and the mode banner so the athlete sees
// it before deciding the day's plan.

const TYPE_LABEL = {
  yoga: 'Yoga',
  walking: 'Walk',
  cycling: 'Easy ride',
  running: 'Easy run',
  treadmill: 'Treadmill',
  elliptical: 'Elliptical',
  rowing: 'Row',
  hiit: 'HIIT',
  strength: 'Strength',
  other: 'Workout',
};

function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtMin(sec) {
  if (!sec) return null;
  return `${Math.round(sec / 60)} min`;
}

export function RecoveryActivityBadge() {
  // 10 covers two days easily even for a heavy workout day; the filter
  // below narrows to recovery-zone work in the last 48 hours.
  const { data } = useRecentWorkouts(10);
  if (!data || data.length === 0) return null;

  const today = todayISO();
  const yesterday = yesterdayISO();

  // Recovery-zone work = Z1 or Z2 by avg HR. Yoga without HR still counts
  // (no HR samples but it's intrinsically recovery), so include it
  // unconditionally as a workout_type heuristic.
  const recovery = data.filter((w) => {
    const onRelevantDay = w.performed_at === today || w.performed_at === yesterday;
    if (!onRelevantDay) return false;
    const z = zoneOf(w.avg_hr);
    if (z && (z.code === 'Z1' || z.code === 'Z2')) return true;
    if (!w.avg_hr && (w.workout_type === 'yoga' || w.workout_type === 'walking')) return true;
    return false;
  });

  if (recovery.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--r3)',
        padding: '10px 14px',
        marginBottom: 14,
        borderLeft: '3px solid var(--green)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--green)', fontSize: 14 }}>☾</span>
      <span style={{ color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: 11 }}>
        Recovery logged
      </span>
      <span style={{ color: 'var(--t2)', flex: 1 }}>
        {recovery
          .map((w) => {
            const when = w.performed_at === today ? 'today' : 'yesterday';
            const label = TYPE_LABEL[w.workout_type] ?? (w.workout_type ?? 'Workout');
            const dur = fmtMin(w.duration_sec);
            return `${label}${dur ? ` · ${dur}` : ''} (${when})`;
          })
          .join(' · ')}
      </span>
    </div>
  );
}
