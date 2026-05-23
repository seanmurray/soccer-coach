import sheetStyles from './CNSBudgetCard.module.css';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { formatDate } from '../lib/dateFormat';

// Surfaces the last few HealthKit / Mywellness workouts pushed in via the
// iOS Shortcut. Renders nothing until the first workout arrives — keeps the
// Today screen quiet on a fresh install or before the user wires the
// Shortcut up.
//
// Reuses the CNSBudgetCard module styles for visual parity with the other
// load cards on Today.

const SOURCE_LABEL = {
  apple_health: 'Apple Health',
  mywellness:   'Technogym',
  shortcut:     'Shortcut',
  manual:       'Manual',
};

const TYPE_LABEL = {
  running:     'Run',
  walking:     'Walk',
  cycling:     'Bike',
  treadmill:   'Treadmill',
  elliptical:  'Elliptical',
  rowing:      'Row',
  strength:    'Strength',
  hiit:        'HIIT',
  other:       'Workout',
};

const fmtDuration = (sec) => {
  if (sec == null) return '—';
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
};

const fmtDistance = (mi) => {
  if (mi == null) return null;
  return `${(Math.round(mi * 100) / 100).toFixed(2)} mi`;
};

export function RecentWorkoutsCard() {
  const { data, isLoading } = useRecentWorkouts(5);
  if (isLoading || !data || data.length === 0) return null;

  return (
    <div className={sheetStyles.card}>
      <div className={sheetStyles.head}>
        <div className={sheetStyles.label}>Recent workouts</div>
        <div className={sheetStyles.zoneLabel} style={{ color: 'var(--t3)' }}>
          {data.length}
        </div>
      </div>

      {data.map((w) => {
        const typeLabel = TYPE_LABEL[w.workout_type] ?? (w.workout_type ?? 'Workout');
        const sourceLabel = SOURCE_LABEL[w.source] ?? w.source;
        const parts = [fmtDuration(w.duration_sec)];
        const dist = fmtDistance(w.distance_mi);
        if (dist) parts.push(dist);
        if (w.avg_hr) parts.push(`HR ${w.avg_hr}` + (w.max_hr ? `/${w.max_hr}` : ''));
        if (w.calories) parts.push(`${w.calories} kcal`);

        return (
          <div
            key={w.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              padding: '6px 0',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--t2)',
              borderTop: '0.5px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ color: 'var(--t3)', flexShrink: 0, minWidth: 96 }}>
              {formatDate(w.performed_at)}
            </span>
            <span style={{ flex: 1, color: 'var(--t1)' }}>
              {typeLabel}
              {!w.session_id && <span style={{ color: 'var(--t4)', marginLeft: 6 }}>· unmatched</span>}
            </span>
            <span style={{ flexShrink: 0, color: 'var(--t2)' }}>{parts.join(' · ')}</span>
          </div>
        );
      })}

      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>
        Source: Apple Health (Watch + Mywellness bridge)
      </div>
    </div>
  );
}
