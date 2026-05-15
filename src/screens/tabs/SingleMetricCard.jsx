import { useState } from 'react';
import styles from './ConditioningTab.module.css';
import { metricFor, parseMetricInput, formatMetricValue } from '../../data/conditioningProtocols';
import { useSessionStore } from '../../stores/sessionStore';

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
  const [saved, setSaved] = useState(false);

  // Empty input → null; bad input → null. Parsed → number (decimal seconds
  // for pace inputs, otherwise the raw number).
  const parsed = metric ? parseMetricInput(raw, metric) : null;
  const canLog = parsed != null && parsed > 0;

  const onLog = () => {
    if (!canLog) return;
    pushPerf({
      exercise_key: protocol.exercise_key,
      exercise_name: protocol.name,
      exercise_type: 'cond',
      day_type: dayType,
      quality: null,
      effort_rpe: protocol.rpe,
      ease: null,
      // unit stored in lowercase — parser & display reconcile via the
      // metric def's displayUnit.
      notes: `[${parsed} ${metric.unit.toLowerCase()}]`,
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
      </div>
    </div>
  );
}
