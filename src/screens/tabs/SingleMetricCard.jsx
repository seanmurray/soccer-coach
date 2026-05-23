import { useState } from 'react';
import styles from './ConditioningTab.module.css';
import { metricFor, parseMetricInput, formatMetricValue, VAR_DURATION_KEYS, DURATION_HINT } from '../../data/conditioningProtocols';
import { useSessionStore } from '../../stores/sessionStore';
import { ExerciseHistoryInline } from '../../components/ExerciseHistoryInline';

// Generic single-metric conditioning card. Used for every conditioning
// protocol except Norwegian 4×4 (which has its own structured per-interval
// component). Each protocol declares `kind: 'single_metric'` in sessions.js
// and a metric definition lives in data/conditioningProtocols.js keyed by
// exercise_key.
//
// Stored notes format:  `[8.5 mph]`  /  `[105 sec]`  /  `[280 W]`
// measurementParse picks the first numeric tag for the chart pipeline.
export function SingleMetricCard({ protocol, warning }) {
  const dayType = useSessionStore((s) => s.dayType);
  const pushPerf = useSessionStore((s) => s.pushExercisePerf);
  const metric = metricFor(protocol.exercise_key);

  const [raw, setRaw] = useState('');
  const [durationRaw, setDurationRaw] = useState('');
  const [saved, setSaved] = useState(false);

  // Empty input → null; bad input → null. Parsed → number (decimal seconds
  // for pace inputs, otherwise the raw number).
  const parsed = metric ? parseMetricInput(raw, metric) : null;
  const canLog = parsed != null && parsed > 0;

  // Variable-prescription protocols (Zone 2, Bangsbo, IFT, bike+court) ask
  // for an optional duration in minutes — pace tells us intensity, duration
  // is the dose. Fixed-prescription protocols don't need it.
  const wantsDuration = VAR_DURATION_KEYS.has(protocol.exercise_key);
  const durationMin = (() => {
    if (!wantsDuration || durationRaw === '') return null;
    const n = Number(durationRaw);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  const onLog = () => {
    if (!canLog) return;
    // Encode duration as a second tag inside the same bracket so
    // parseMeasurement still finds the metric tag as the first numeric value.
    //   "[8.5 mph]"           — no duration
    //   "[8.5 mph · 25 min]"  — with duration
    const tags = [`${parsed} ${metric.unit.toLowerCase()}`];
    if (durationMin != null) tags.push(`${durationMin} min`);
    pushPerf({
      exercise_key: protocol.exercise_key,
      exercise_name: protocol.name,
      exercise_type: 'cond',
      day_type: dayType,
      quality: null,
      effort_rpe: protocol.rpe,
      ease: null,
      notes: `[${tags.join(' · ')}]`,
      performed_at: new Date().toISOString(),
    });
    setSaved(true);
  };

  // Pace inputs accept "1:45" or "105"; decimal inputs are plain numbers.
  const placeholder = metric?.inputMode === 'pace' ? '1:45' : (metric?.unit ?? '');
  const inputType = metric?.inputMode === 'pace' ? 'text' : 'number';
  const displayUnit = metric?.displayUnit ?? metric?.unit ?? '';

  return (
    <div className={`${styles.protocol} ${warning ? styles.notRecommended : ''}`}>
      <div className={styles.head}>
        <div>
          <div className={styles.name}>{protocol.name}</div>
          <div className={styles.rpe}>RPE {protocol.rpe}</div>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.desc}>{protocol.desc}</div>
        {warning && <div className={styles.warning}>{warning}</div>}

        {metric && (
          <>
            <div className={styles.metricRow}>
              <div className={styles.metricLabel}>{metric.label}</div>
              <input
                type={inputType}
                inputMode={metric.inputMode === 'pace' ? 'numeric' : 'decimal'}
                step={metric.step}
                min={metric.min}
                max={metric.max}
                placeholder={placeholder}
                className={styles.metricInput}
                value={raw}
                onChange={(e) => { setRaw(e.target.value); setSaved(false); }}
              />
              <div className={styles.metricUnit}>{displayUnit}</div>
            </div>

            {parsed != null && metric.inputMode === 'pace' && (
              <div className={styles.metricHint}>
                = {formatMetricValue(parsed, metric)} ({parsed} sec)
              </div>
            )}

            {wantsDuration && (
              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>Duration (optional)</div>
                <input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="1"
                  max="120"
                  placeholder={DURATION_HINT[protocol.exercise_key] ?? '20'}
                  className={styles.metricInput}
                  value={durationRaw}
                  onChange={(e) => { setDurationRaw(e.target.value); setSaved(false); }}
                />
                <div className={styles.metricUnit}>min</div>
              </div>
            )}

            <button
              type="button"
              className={`${styles.logBtn} ${saved ? styles.saved : ''}`}
              onClick={onLog}
              disabled={!canLog || saved}
            >
              {saved ? 'Logged ✓' : 'Log result'}
            </button>
          </>
        )}
        <ExerciseHistoryInline exerciseKey={protocol.exercise_key} kind="conditioning" />
      </div>
    </div>
  );
}
