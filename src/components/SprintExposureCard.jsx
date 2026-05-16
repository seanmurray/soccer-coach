import styles from './CNSBudgetCard.module.css';
import { useSprintExposure } from '../hooks/useSprintExposure';
import { sprintExposureNarrative } from '../lib/sprintExposure';

// Reuses CNSBudgetCard styles for visual consistency. Zone → color:
//   under = amber (action needed, injury-risk direction)
//   ok    = green (protective range)
//   high  = blue  (plenty; cross-check CNS)
const ZONE_CLASS = {
  under: styles.zoneAmber,
  ok:    styles.zoneGreen,
  high:  styles.zoneOkay,
};

const ZONE_LABEL = {
  under: 'Under-exposed',
  ok:    'Protective',
  high:  'High volume',
};

export function SprintExposureCard() {
  const { data, isLoading } = useSprintExposure();
  if (isLoading || !data) return null;

  // No sessions at all in the 14-day window → don't surface a scary
  // "under-exposed" card on a fresh/returning-from-layoff blank slate.
  if (data.sessionCount === 0) return null;

  const { count7, daysSinceLast, zone } = data;
  const { text } = sprintExposureNarrative(zone, count7, daysSinceLast);

  return (
    <div className={`${styles.card} ${ZONE_CLASS[zone] ?? ''}`}>
      <div className={styles.head}>
        <div className={styles.label}>Sprint exposure (7 days)</div>
        <div className={styles.zoneLabel}>{ZONE_LABEL[zone]}</div>
      </div>
      <div className={styles.total}>{count7}</div>
      <div className={styles.text}>{text}</div>
      <div className={styles.breakdown}>
        <span>
          Last exposure{' '}
          <strong>
            {daysSinceLast == null
              ? '—'
              : daysSinceLast === 0
                ? 'today'
                : `${daysSinceLast}d ago`}
          </strong>
        </span>
      </div>
    </div>
  );
}
