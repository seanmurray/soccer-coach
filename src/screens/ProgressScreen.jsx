import { useMemo, useState } from 'react';
import styles from './ProgressScreen.module.css';
import { useProgressSeries } from '../hooks/useProgressSeries';
import { LineChart } from '../components/LineChart';
import { MAXES_CONFIG, EX } from '../data/exercises';
import { formatMetricValue, metricFor, isConditioningKey } from '../data/conditioningProtocols';

// Long-term progression view. Two groups, picked from a top tab bar:
//   • Strength — e1RM per main lift (Brzycki / RIR)
//   • Jumps    — measured plyo distances + heights
// Plus a session-RPE chart at the bottom for overall load trend.

const GROUPS = ['strength', 'jumps', 'cond'];
const GROUP_LABEL = { strength: 'Strength', jumps: 'Jumps', cond: 'Conditioning' };

// isConditioningKey is sourced from data/conditioningProtocols so the
// definition stays in one place (every registered conditioning protocol +
// the legacy `cond_*` prefix from earlier free-form picks).

const LIFT_LABEL = Object.fromEntries(MAXES_CONFIG.map((m) => [m.key, m.label]));

export function ProgressScreen() {
  const { data, isLoading, error } = useProgressSeries();
  const [group, setGroup] = useState('strength');

  // Hooks must run in stable order — keep useMemo above any early returns.
  const strengthCharts = useMemo(() => {
    if (!data?.strengthSeries) return [];
    return Object.entries(data.strengthSeries)
      .filter(([, points]) => points.length > 0)
      .map(([liftKey, points]) => ({
        liftKey,
        title: LIFT_LABEL[liftKey] ?? liftKey,
        points,
      }));
  }, [data]);

  const measureCharts = useMemo(() => {
    if (!data?.measureSeries) return [];
    return Object.entries(data.measureSeries)
      .filter(([, series]) => series.points.length > 0)
      .map(([exKey, series]) => ({
        exKey,
        title: EX[exKey]?.name ?? series.name ?? exKey,
        unit: series.unit,
        points: series.points,
        higherIsBetter: series.higherIsBetter ?? true,
        formatValue: series.inputMode === 'pace'
          ? (v) => formatMetricValue(v, metricFor(exKey))
          : undefined,
        isCond: isConditioningKey(exKey),
      }));
  }, [data]);

  const jumpsCharts = useMemo(() => measureCharts.filter((c) => !c.isCond), [measureCharts]);
  const condCharts  = useMemo(() => measureCharts.filter((c) =>  c.isCond), [measureCharts]);

  if (isLoading) {
    return (
      <main className="screen">
        <div className="title-xl" style={{ marginBottom: 20 }}>Progress</div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="screen">
        <div className="title-xl" style={{ marginBottom: 20 }}>Progress</div>
        <div className={styles.empty}>Couldn't load progress data: {error.message ?? String(error)}</div>
      </main>
    );
  }

  const totalPoints =
    strengthCharts.reduce((sum, c) => sum + c.points.length, 0) +
    measureCharts.reduce((sum, c) => sum + c.points.length, 0);

  if (totalPoints === 0) {
    return (
      <main className="screen">
        <div className="title-xl" style={{ marginBottom: 20 }}>Progress</div>
        <div className={styles.empty}>
          <strong>No trend data yet.</strong>
          <div style={{ marginTop: 8 }}>
            Log a few strength sets and jump measurements and the trends will show up here.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="title-xl" style={{ marginBottom: 20 }}>Progress</div>

      <div className={styles.tabBar} role="tablist" aria-label="Progress sections">
        {GROUPS.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={group === g}
            className={`${styles.tab} ${group === g ? styles.active : ''}`}
            onClick={() => setGroup(g)}
          >
            {GROUP_LABEL[g]}
          </button>
        ))}
      </div>

      {group === 'strength' && (
        strengthCharts.length === 0 ? (
          <div className={styles.empty}>No strength data yet — log sets on the main lifts to start tracking 1RM estimates.</div>
        ) : (
          strengthCharts.map((c) => (
            <LineChart
              key={c.liftKey}
              title={`${c.title} · estimated 1RM`}
              unit="lbs"
              data={c.points}
              color="#30d158"
            />
          ))
        )
      )}

      {group === 'jumps' && (
        jumpsCharts.length === 0 ? (
          <div className={styles.empty}>No measurement data yet — log a distance or height in the feedback notes on a plyo to start tracking.</div>
        ) : (
          jumpsCharts.map((c) => (
            <LineChart
              key={c.exKey}
              title={c.title}
              unit={c.unit}
              data={c.points}
              color="#bf5af2"
              higherIsBetter={c.higherIsBetter}
              formatValue={c.formatValue}
            />
          ))
        )
      )}

      {group === 'cond' && (
        condCharts.length === 0 ? (
          <div className={styles.empty}>No conditioning measurements yet — log a Norwegian 4×4 (or any measured protocol) to start tracking pace over time.</div>
        ) : (
          condCharts.map((c) => (
            <LineChart
              key={c.exKey}
              title={c.title}
              unit={c.unit}
              data={c.points}
              color="#ff9500"
              higherIsBetter={c.higherIsBetter}
              formatValue={c.formatValue}
            />
          ))
        )
      )}

      <div className={styles.groupHeader}>Session load</div>
      <LineChart
        title="Session RPE over time"
        unit=""
        data={data?.sessionRpeSeries ?? []}
        color="#0a84ff"
      />

      <div className={styles.legend}>
        <span><span className={styles.dotPR} /> = personal record</span>
      </div>
    </main>
  );
}
