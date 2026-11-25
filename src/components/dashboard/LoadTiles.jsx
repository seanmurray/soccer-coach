import styles from './Dashboard.module.css';
import { useACWR } from '../../hooks/useACWR';
import { useSprintExposure } from '../../hooks/useSprintExposure';
import { Icon } from '../ui/Icon';

const LOAD_ZONE = {
  low:     { color: 'var(--blue)',  label: 'Light week' },
  ok:      { color: 'var(--green)', label: 'Steady' },
  caution: { color: 'var(--amber)', label: 'Climbing' },
  high:    { color: 'var(--red)',   label: 'Sharp ramp' },
  idle:    { color: 'var(--t3)',    label: 'No data' },
};
const TREND = { rising: '↑', easing: '↓', steady: '→' };
const SPRINT_ZONE = {
  under: { color: 'var(--amber)', label: 'Under-exposed' },
  ok:    { color: 'var(--green)', label: 'Protective' },
  high:  { color: 'var(--amber)', label: 'High volume' },
};

// Two glanceable tiles: 7-day training load (sRPE × min, with trend) and
// high-speed exposures in the last 7 days. Tapping either jumps to the full
// Training load section further down the Dashboard.
export function LoadTiles({ onOpen }) {
  const { data: acwr } = useACWR();
  const { data: sprint } = useSprintExposure();

  const showLoad = !!acwr && !(acwr.zone === 'idle' && acwr.samples < 2);
  const showSprint = !!sprint && sprint.sessionCount > 0;
  if (!showLoad && !showSprint) return null;

  const lz = LOAD_ZONE[acwr?.zone] ?? LOAD_ZONE.idle;
  const sz = SPRINT_ZONE[sprint?.zone] ?? SPRINT_ZONE.ok;

  return (
    <div className={styles.tiles}>
      {showLoad && (
        <button type="button" className={styles.tile} onClick={onOpen}>
          <div className={styles.tileLabel}><Icon name="wave" size={18} className={styles.tileIcon} /> Load · 7 days</div>
          <div className={styles.tileValue}>
            {acwr.acute}<span className={styles.tileTrend}>{TREND[acwr.trend] ?? ''}</span>
          </div>
          <div className={styles.tileSub} style={{ color: lz.color }}>{lz.label}</div>
        </button>
      )}
      {showSprint && (
        <button type="button" className={styles.tile} onClick={onOpen}>
          <div className={styles.tileLabel}><Icon name="bolt" size={18} className={styles.tileIcon} /> Sprints · 7 days</div>
          <div className={styles.tileValue}>{sprint.count7}</div>
          <div className={styles.tileSub} style={{ color: sz.color }}>{sz.label}</div>
        </button>
      )}
    </div>
  );
}
