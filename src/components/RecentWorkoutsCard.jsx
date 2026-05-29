import sheetStyles from './CNSBudgetCard.module.css';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { formatDate } from '../lib/dateFormat';
import { zoneOf, calibratedHRmax, ZONE_META } from '../lib/hrZones';

// Stacked Z1-Z5 time-in-zone bar. Renders nothing unless the workout carries
// hr_zone_sec (computed server-side at ingest from the raw HR samples). Each
// segment's width is proportional to seconds spent in that zone; colors match
// the zone chips and load cards.
const ZONE_ORDER = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
function ZoneBar({ zoneSec }) {
  if (!zoneSec || typeof zoneSec !== 'object') return null;
  const total = ZONE_ORDER.reduce((s, c) => s + (Number(zoneSec[c]) || 0), 0);
  if (total <= 0) return null;
  return (
    <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 5, gap: 1 }}>
      {ZONE_ORDER.map((c) => {
        const sec = Number(zoneSec[c]) || 0;
        if (sec <= 0) return null;
        const mins = Math.round(sec / 60);
        return (
          <div
            key={c}
            title={`${ZONE_META[c].label} (${c}): ${mins} min`}
            style={{ flexGrow: sec, background: ZONE_META[c].color, opacity: 0.85 }}
          />
        );
      })}
    </div>
  );
}

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
  yoga:        'Yoga',
  swimming:    'Swim',
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

  // Calibrate HRmax from the observed maxes in this set so the zone chip
  // scores against the athlete's real ceiling, not just the 185 estimate.
  const hrMax = calibratedHRmax(data.map((w) => w.max_hr).filter((m) => m != null));

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
        // HRR — 1-min heart-rate recovery (bpm drop). Higher = fitter/fresher
        // autonomic recovery. Shown with a down-arrow to read as "dropped N".
        if (w.hrr_bpm) parts.push(`HRR ↓${w.hrr_bpm}`);
        if (w.calories) parts.push(`${w.calories} kcal`);

        // Zone badge — small chip showing which HR zone the workout's avg HR
        // landed in (Z1 Recovery → Z5 VO2max), scored against the calibrated
        // HRmax. Skipped when avg_hr is null.
        const zone = zoneOf(w.avg_hr, hrMax);

        return (
          <div key={w.id} style={{ padding: '6px 0', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--t2)',
              }}
            >
              <span style={{ color: 'var(--t3)', flexShrink: 0, minWidth: 96 }}>
                {formatDate(w.performed_at)}
              </span>
              <span style={{ flex: 1, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {typeLabel}
                {zone && (
                  <span
                    title={`${zone.label} · ${zone.low}-${zone.high} bpm`}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: zone.color,
                      border: `0.5px solid ${zone.color}`,
                      borderRadius: 4,
                      padding: '1px 5px',
                      lineHeight: 1.3,
                    }}
                  >
                    {zone.code}
                  </span>
                )}
                {!w.session_id && <span style={{ color: 'var(--t4)' }}>· unmatched</span>}
              </span>
              <span style={{ flexShrink: 0, color: 'var(--t2)' }}>{parts.join(' · ')}</span>
            </div>
            <ZoneBar zoneSec={w.hr_zone_sec} />
          </div>
        );
      })}

      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>
        Source: Apple Health (Watch + Mywellness bridge)
      </div>
    </div>
  );
}
