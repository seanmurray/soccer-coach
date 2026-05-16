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

  const { acute, chronicWeekly, ratio, zone, trend, samples } = data;
  // Don't surface until there's at least a week's worth of data.
  if (zone === 'idle' && samples < 2) return null;

  const { text } = acwrNarrative(zone, ratio);

  return (
    <div className={`${styles.card} ${ZONE_CLASS[zone] ?? ''}`}>
      <div className={styles.head}>
        <div className={styles.label}>Training load (7 days)</div>
        <div className={styles.zoneLabel}>{ZONE_LABEL[zone]}</div>
      </div>
      <div className={styles.ratio}>{acute}</div>
      <div className={styles.text}>{text}</div>
      <div className={styles.detail}>
        {acwrTrendLabel(trend)} · 4-wk weekly avg {chronicWeekly} ·{' '}
        {ratio != null ? `${ratio.toFixed(2)}× ratio` : 'ratio —'} · {samples} session{samples === 1 ? '' : 's'}
      </div>
    </div>
  );
}
