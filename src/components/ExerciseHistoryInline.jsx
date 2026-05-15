import styles from './ExerciseHistoryInline.module.css';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { formatDate } from '../lib/dateFormat';
import { parseMeasurement } from '../lib/measurementParse';
import { metricFor, formatMetricValue } from '../data/conditioningProtocols';

// Inline "Recent" block — last 3 sessions of one exercise.
// `kind` controls both the data source and the per-row format:
//   'sets'         — strength / build-with-SetTable (set count × reps @ weight · RPE)
//   'feedback'     — build with FeedbackBlock (quality · RPE · ease)
//   'conditioning' — conditioning protocols (parsed measurement · RPE)
//
// Stays silent (renders nothing) when there's no prior data — first-run
// shouldn't add visual noise.
export function ExerciseHistoryInline({ exerciseKey, kind }) {
  const dataKind = kind === 'sets' ? 'sets' : 'perf';
  const { data, isLoading } = useExerciseHistory(exerciseKey, dataKind);

  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <div className={styles.history}>
      <div className={styles.label}>Recent</div>
      {data.map((row) => (
        <div key={row.sessionId} className={styles.row}>
          <span className={styles.date}>{formatDate(row.performedAt)}</span>
          <span className={styles.dash}>—</span>
          <span className={styles.body}>{summarize(row, kind, exerciseKey)}</span>
        </div>
      ))}
    </div>
  );
}

function summarize(row, kind, exerciseKey) {
  if (kind === 'sets') return summarizeSets(row.sets);
  if (kind === 'conditioning') return summarizeConditioning(row, exerciseKey);
  return summarizeFeedback(row);
}

// "N×R @ W lbs · RPE X" — N = total sets, R/W = reps/weight at the heaviest
// weight (top working set), RPE = highest logged RPE across the session.
function summarizeSets(sets) {
  if (!sets?.length) return '—';
  const valid = sets.filter((s) => s.actual_reps != null || s.actual_weight != null);
  if (!valid.length) return '—';

  const weights = valid.map((s) => s.actual_weight ?? 0);
  const topWeight = Math.max(...weights);
  const atTop = valid.filter((s) => (s.actual_weight ?? 0) === topWeight);
  const topReps = Math.max(...atTop.map((s) => s.actual_reps ?? 0));
  const rpes = valid.map((s) => s.rpe ?? 0).filter((n) => n > 0);
  const topRpe = rpes.length ? Math.max(...rpes) : null;

  const parts = [`${valid.length}×${topReps}`];
  if (topWeight > 0) parts.push(`@ ${topWeight} lbs`);
  if (topRpe != null) parts.push(`RPE ${topRpe}`);
  return parts.join(' · ');
}

function summarizeFeedback(row) {
  const parts = [];
  if (row.quality != null) parts.push(`Q ${row.quality}/5`);
  if (row.effortRpe != null) parts.push(`RPE ${row.effortRpe}`);
  if (row.ease != null) parts.push(`Ease ${row.ease}/5`);
  return parts.length ? parts.join(' · ') : '—';
}

function summarizeConditioning(row, exerciseKey) {
  const parsed = parseMeasurement(row.notes);
  const metric = metricFor(exerciseKey);

  let measurement = null;
  if (parsed) {
    if (metric?.inputMode === 'pace') {
      measurement = formatMetricValue(parsed.value, metric);
    } else {
      const unit = metric?.displayUnit ?? metric?.unit ?? parsed.unit;
      measurement = `${parsed.value} ${unit}`;
    }
  }

  const parts = [];
  if (measurement) parts.push(measurement);
  if (row.effortRpe != null) parts.push(`RPE ${row.effortRpe}`);
  return parts.length ? parts.join(' · ') : '—';
}
