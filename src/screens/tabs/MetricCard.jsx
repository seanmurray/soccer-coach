import { useState } from 'react';
import styles from './ConditioningTab.module.css';
import {
  metricFor, parseMetricInput, formatMetricValue, aggregateSets,
  VAR_DURATION_KEYS, DURATION_HINT,
} from '../../data/conditioningProtocols';
import { useSessionStore } from '../../stores/sessionStore';
import { ExerciseHistoryInline } from '../../components/ExerciseHistoryInline';

// Conditioning result card — handles every tracked protocol, 1 set or N.
//
// Set count comes from `protocol.sets` (mode-aware; see data/sessions.js) and
// defaults to 1. Multi-set protocols get one input per round because machines
// reset mid-session and their built-in "average" usually includes rest time,
// which understates real work output. We aggregate the rounds ourselves.
//
// PARTIAL SESSIONS ARE VALID. You can log with any subset of rounds filled —
// cut a 4×4 short after two intervals and it still records, averaged over the
// two you actually did, tagged with the count.
//
// Stored notes format (unchanged for single-set, extended for multi-set):
//   [8.5 mph]                                          — single
//   [8.5 mph · 25 min]                                 — single + duration
//   [8.75 mph · int1:8.5 · int2:9 · 4 of 4]            — full multi-set
//   [8.75 mph · int1:8.5 · int2:9 · 2 of 4 · partial]  — cut short
// measurementParse reads the FIRST numeric tag, so the aggregate stays the
// charted value in every shape.
const setNoteKey = (i) => `int${i + 1}`;

// Recover typed per-set values from an already-logged note so a PWA reload
// mid-session restores the inputs and the "Logged ✓" state.
function parseSetsFromNotes(notes, count) {
  if (!notes) return null;
  const out = Array(count).fill('');
  let found = false;
  for (let i = 0; i < count; i++) {
    const m = notes.match(new RegExp(`${setNoteKey(i)}:([0-9.:]+)`));
    if (m) { out[i] = m[1]; found = true; }
  }
  return found ? out : null;
}

export function MetricCard({ protocol, warning }) {
  const dayType = useSessionStore((s) => s.dayType);
  const pushPerf = useSessionStore((s) => s.pushExercisePerf);
  const existing = useSessionStore((s) =>
    s.exercisePerfBuffer.find((p) => p.exercise_key === protocol.exercise_key)
  );

  const metric = metricFor(protocol.exercise_key);
  const setCount = Math.max(1, protocol.sets ?? 1);
  const multi = setCount > 1;

  const [values, setValues] = useState(
    () => parseSetsFromNotes(existing?.notes, setCount) ?? Array(setCount).fill('')
  );
  const [durationRaw, setDurationRaw] = useState('');
  const [saved, setSaved] = useState(!!existing);

  const { value: agg, count: doneCount } = aggregateSets(values, metric);
  const canLog = agg != null && agg > 0;
  const isPartial = multi && doneCount > 0 && doneCount < setCount;

  // Variable-prescription protocols (Zone 2, Bangsbo, IFT, bike+court) ask for
  // an optional duration — pace tells us intensity, duration is the dose.
  const wantsDuration = VAR_DURATION_KEYS.has(protocol.exercise_key);
  const durationMin = (() => {
    if (!wantsDuration || durationRaw === '') return null;
    const n = Number(durationRaw);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  const update = (idx, next) => {
    setValues((prev) => prev.map((v, i) => (i === idx ? next : v)));
    setSaved(false);
  };

  const onLog = () => {
    if (!canLog) return;
    const tags = [`${agg} ${metric.unit.toLowerCase()}`];
    if (multi) {
      values.forEach((v, i) => {
        const n = parseMetricInput(v, metric);
        if (Number.isFinite(n) && n > 0) tags.push(`${setNoteKey(i)}:${n}`);
      });
      tags.push(`${doneCount} of ${setCount}`);
      if (isPartial) tags.push('partial');
    }
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
  // type=text + inputMode keeps a controlled field from eating the decimal
  // point mid-typing (see components/NumField for the full explanation).
  const isPace = metric?.inputMode === 'pace';
  const placeholder = isPace ? '1:45' : (metric?.unit ?? '');
  const displayUnit = metric?.displayUnit ?? metric?.unit ?? '';
  const setLabel = metric?.setLabel ?? 'Set';
  const aggLabel = metric?.aggregate === 'total' ? 'Total' : 'Average';

  const sanitize = (s) => (isPace ? s.replace(/[^0-9:.]/g, '') : s.replace(/[^0-9.]/g, ''));

  return (
    <div className={`${styles.protocol} ${warning ? styles.notRecommended : ''}`}>
      <div className={styles.head}>
        <div>
          <div className={styles.name}>{protocol.name}</div>
          <div className={styles.rpe}>
            RPE {protocol.rpe}{multi ? ` · ${setCount} sets` : ''}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.desc}>{protocol.desc}</div>
        {warning && <div className={styles.warning}>{warning}</div>}

        {metric && (
          <>
            {multi ? (
              <>
                <div className={styles.intervalGrid}>
                  {values.map((v, i) => (
                    <div key={i} className={styles.intervalCell}>
                      <div className={styles.intervalLabel}>{setLabel} {i + 1}</div>
                      <input
                        type="text"
                        inputMode={isPace ? 'numeric' : 'decimal'}
                        placeholder={placeholder}
                        className={styles.intervalInput}
                        value={v}
                        onChange={(e) => update(i, sanitize(e.target.value))}
                        aria-label={`${setLabel} ${i + 1} ${displayUnit}`}
                      />
                      <div className={styles.intervalUnit}>{displayUnit}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.setsHint}>
                  Fill in what you did — a session cut short still logs.
                </div>
              </>
            ) : (
              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>{metric.label}</div>
                <input
                  type="text"
                  inputMode={isPace ? 'numeric' : 'decimal'}
                  placeholder={placeholder}
                  className={styles.metricInput}
                  value={values[0]}
                  onChange={(e) => update(0, sanitize(e.target.value))}
                  aria-label={metric.label}
                />
                <div className={styles.metricUnit}>{displayUnit}</div>
              </div>
            )}

            {agg != null && isPace && (
              <div className={styles.metricHint}>
                = {formatMetricValue(agg, metric)} ({agg} sec)
              </div>
            )}

            {multi && (
              <div className={styles.avgRow}>
                <div className={styles.avgLabel}>
                  {aggLabel}
                  {doneCount > 0 && (
                    <span className={styles.avgCount}>
                      {' '}· {doneCount} of {setCount}{isPartial ? ' (partial)' : ''}
                    </span>
                  )}
                </div>
                <div className={styles.avgValue}>
                  {agg != null ? `${formatMetricValue(agg, metric)} ${displayUnit}` : '—'}
                </div>
              </div>
            )}

            {wantsDuration && (
              <div className={styles.metricRow}>
                <div className={styles.metricLabel}>Duration (optional)</div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={DURATION_HINT[protocol.exercise_key] ?? '20'}
                  className={styles.metricInput}
                  value={durationRaw}
                  onChange={(e) => { setDurationRaw(e.target.value.replace(/[^0-9]/g, '')); setSaved(false); }}
                  aria-label="Duration in minutes"
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
              {saved
                ? 'Logged ✓'
                : isPartial
                  ? `Log ${doneCount} of ${setCount}`
                  : 'Log result'}
            </button>
          </>
        )}

        <ExerciseHistoryInline exerciseKey={protocol.exercise_key} kind="conditioning" />
      </div>
    </div>
  );
}
