import styles from './Common.module.css';
import { useSessionStore } from '../stores/sessionStore';
import { getPhaseLabel } from '../lib/periodization';

export function WeekBar() {
  const week = useSessionStore((s) => s.week);
  const setWeek = useSessionStore((s) => s.setWeek);
  const phase = getPhaseLabel(week);

  return (
    <div className={styles.weekBar}>
      <div className={styles.weekLabel}>Wk{week}</div>
      <div className={styles.phaseChip}>{phase}</div>
      <div className={styles.weekNav}>
        <button type="button" className={styles.weekNavBtn} onClick={() => setWeek(week - 1)} aria-label="Previous week">←</button>
        <button type="button" className={styles.weekNavBtn} onClick={() => setWeek(week + 1)} aria-label="Next week">→</button>
      </div>
    </div>
  );
}
