import styles from './CNSBudgetCard.module.css';
import { useCNSBudget } from '../hooks/useCNSBudget';
import { cnsBudgetNarrative } from '../lib/cnsBudget';

const ZONE_CLASS = {
  green: styles.zoneGreen,
  okay:  styles.zoneOkay,
  amber: styles.zoneAmber,
  red:   styles.zoneRed,
};

const ZONE_LABEL = {
  green: 'Fresh',
  okay:  'Normal',
  amber: 'Stacked',
  red:   'Overdraft',
};

export function CNSBudgetCard() {
  const { data, isLoading } = useCNSBudget();
  if (isLoading || !data) return null;

  // Don't surface until there's at least one session in the window — avoids
  // a "0 / fresh" card on a brand new account.
  if (data.sessionCount === 0) return null;

  const { total, zone, perDay } = data;
  const { text } = cnsBudgetNarrative(zone);
  const totals = Object.values(perDay).reduce(
    (acc, d) => ({
      strength: acc.strength + d.strength,
      plyo:     acc.plyo + d.plyo,
      cond:     acc.cond + d.cond,
    }),
    { strength: 0, plyo: 0, cond: 0 }
  );

  return (
    <div className={`${styles.card} ${ZONE_CLASS[zone] ?? ''}`}>
      <div className={styles.head}>
        <div className={styles.label}>CNS budget (3 days)</div>
        <div className={styles.zoneLabel}>{ZONE_LABEL[zone]}</div>
      </div>
      <div className={styles.total}>{total}</div>
      <div className={styles.text}>{text}</div>
      <div className={styles.breakdown}>
        <span>Strength <strong>{totals.strength.toFixed(1)}</strong></span>
        <span>Plyo/sprint <strong>{totals.plyo.toFixed(1)}</strong></span>
        <span>Conditioning <strong>{totals.cond.toFixed(1)}</strong></span>
      </div>
    </div>
  );
}
