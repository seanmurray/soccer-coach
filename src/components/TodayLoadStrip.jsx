import styles from './TodayLoadStrip.module.css';
import { useACWR } from '../hooks/useACWR';
import { useCNSBudget } from '../hooks/useCNSBudget';

// Compact, glanceable summary of training-load state on Today. Two stat chips —
// load trend (ACWR acute) and CNS budget — color-coded by zone. Tapping the
// strip jumps to the full Load tab. Renders nothing until there's something
// worth showing, so Today stays quiet on a fresh account.
//
// This is intentionally a *summary*: the detailed cards live on the Load tab.

const LOAD_ZONE_COLOR = {
  low:     'var(--blue)',
  ok:      'var(--green)',
  caution: 'var(--amber)',
  high:    'var(--red)',
  idle:    'var(--t3)',
};

const TREND_ARROW = { rising: '↑', easing: '↓', steady: '→' };

const CNS_ZONE_COLOR = {
  green: 'var(--green)',
  okay:  'var(--blue)',
  amber: 'var(--amber)',
  red:   'var(--red)',
};
const CNS_ZONE_LABEL = { green: 'Fresh', okay: 'Normal', amber: 'Stacked', red: 'Overdraft' };

export function TodayLoadStrip({ onOpen }) {
  const { data: acwr } = useACWR();
  const { data: cns } = useCNSBudget();

  const showLoad = !!acwr && !(acwr.zone === 'idle' && acwr.samples < 2);
  const showCns = !!cns && ((cns.sessionCount ?? 0) > 0 || (cns.workoutCount ?? 0) > 0);
  if (!showLoad && !showCns) return null;

  return (
    <button type="button" className={styles.strip} onClick={onOpen} aria-label="Open Load tab">
      {showLoad && (
        <div className={styles.chip}>
          <span className={styles.chipLabel}>Load</span>
          <span className={styles.chipValue} style={{ color: LOAD_ZONE_COLOR[acwr.zone] ?? 'var(--t1)' }}>
            {acwr.acute}
            <span className={styles.trend}>{TREND_ARROW[acwr.trend] ?? ''}</span>
          </span>
        </div>
      )}

      {showLoad && showCns && <div className={styles.divider} aria-hidden />}

      {showCns && (
        <div className={styles.chip}>
          <span className={styles.chipLabel}>CNS</span>
          <span className={styles.chipValue} style={{ color: CNS_ZONE_COLOR[cns.zone] ?? 'var(--t1)' }}>
            {cns.total}
            <span className={styles.zoneTag}>{CNS_ZONE_LABEL[cns.zone] ?? ''}</span>
          </span>
        </div>
      )}

      <span className={styles.chevron} aria-hidden>›</span>
    </button>
  );
}
