import styles from './ACWRCard.module.css';
import { useACWR } from '../hooks/useACWR';
import { acwrNarrative, acwrTrendLabel } from '../lib/acwr';

const ZONE_CLASS = {
  idle:    styles.zoneIdle,
  low:     styles.zoneLow,
  ok:      styles.zoneOk,
  caution: styles.zoneCaution,
  high:    styles.zoneHigh,
};

const ZONE_LABEL = {
  idle:    'No data',
  low:     'Light week',
  ok:      'Steady',
  caution: 'Climbing',
  high:    'Sharp ramp',
};

export function ACWRCard() {
  const { data, isLoading } = useACWR();
  if (isLoading || !data) return null;

  const { acute, chronicWeekly, ratio, zone, trend, samples, combined, workoutCount } = data;
  // Don't surface until there's at least a week's worth of data.
  if (zone === 'idle' && samples < 2) return null;

  const { text } = acwrNarrative(zone, ratio);

  // The headline number is soccer-only sRPE × duration — same scale users
  // have been seeing all along. When push-workout has ingested standalone
  // cardio in the window, we add a second line with the combined load. Both
  // sides are Foster RPE × minutes (same unit), so the combined total and
  // ratio are directly meaningful. Hidden when there are no contributing
  // workouts so the card stays clean before the Shortcut is wired up.
  const showCombined = combined && workoutCount > 0;

  return (
    <div className={`${styles.card} ${ZONE_CLASS[zone] ?? ''}`}>
      <div className={styles.head}>
        <div className={styles.label}>Training load (7 days)</div>
        <div className={styles.zoneLabel}>{ZONE_LABEL[zone]}</div>
      </div>
      <div className={styles.ratio}>{acute}</div>
      <div className={styles.text}>{text}</div>
      {showCombined && (
        <div className={styles.detail}>
          + {combined.acute - acute} load from {workoutCount} workout{workoutCount === 1 ? '' : 's'} ·{' '}
          combined <strong style={{ color: 'var(--t2)' }}>{combined.acute}</strong>
          {combined.ratio != null && (
            <> · {combined.ratio.toFixed(2)}× ratio</>
          )}
        </div>
      )}
      <div className={styles.detail}>
        {acwrTrendLabel(trend)} · 4-wk weekly avg {chronicWeekly} ·{' '}
        {ratio != null ? `${ratio.toFixed(2)}× ratio` : 'ratio —'} · {samples} session{samples === 1 ? '' : 's'}
      </div>
    </div>
  );
}
