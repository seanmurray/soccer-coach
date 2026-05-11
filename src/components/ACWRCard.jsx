import styles from './ACWRCard.module.css';
import { useACWR } from '../hooks/useACWR';
import { acwrNarrative } from '../lib/acwr';

const ZONE_CLASS = {
  idle:    styles.zoneIdle,
  low:     styles.zoneLow,
  ok:      styles.zoneOk,
  caution: styles.zoneCaution,
  high:    styles.zoneHigh,
};

const ZONE_LABEL = {
  idle:    'No data',
  low:     'Undertrained',
  ok:      'Safe',
  caution: 'Ramping',
  high:    'High risk',
};

export function ACWRCard() {
  const { data, isLoading } = useACWR();
  if (isLoading || !data) return null;

  const { acute, chronicWeekly, ratio, zone, samples } = data;
  // Don't surface until there's at least a week's worth of data.
  if (zone === 'idle' && samples < 2) return null;

  const { text } = acwrNarrative(zone, ratio);

  return (
    <div className={`${styles.card} ${ZONE_CLASS[zone] ?? ''}`}>
      <div className={styles.head}>
        <div className={styles.label}>Training load</div>
        <div className={styles.zoneLabel}>{ZONE_LABEL[zone]}</div>
      </div>
      <div className={styles.ratio}>{ratio != null ? ratio.toFixed(2) + '×' : '—'}</div>
      <div className={styles.text}>{text}</div>
      <div className={styles.detail}>
        7-day load: {acute} · 28-day weekly avg: {chronicWeekly} · {samples} session{samples === 1 ? '' : 's'}
      </div>
    </div>
  );
}
