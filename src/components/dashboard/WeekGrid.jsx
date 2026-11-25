import styles from './Dashboard.module.css';
import { useSessions } from '../../hooks/useSessions';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { DAY_TYPE_INFO } from '../../data/sessions';
import { weekGrid } from '../../lib/dashboard';

// Days × weeks grid of logged sessions — one row per training day (in your
// day order), one column per program week, filled where a session exists.
// The current week's column is outlined.
export function WeekGrid() {
  const { data: sessions } = useSessions();
  const dayOrder = useSettingsStore((s) => s.dayOrder);
  const week = useSessionStore((s) => s.week);
  const { weeks, rows } = weekGrid(sessions, dayOrder, week, 10);

  return (
    <div className={styles.grid} style={{ gridTemplateColumns: `40px repeat(${weeks.length}, 1fr)` }}>
      <span />
      {weeks.map((w) => (
        <span key={w} className={`${styles.gridHead} ${w === week ? styles.gridHeadOn : ''}`}>{w}</span>
      ))}
      {rows.map((r) => (
        <Row key={r.day} label={DAY_TYPE_INFO[r.day]?.short ?? r.day} cells={r.cells} weeks={weeks} week={week} />
      ))}
    </div>
  );
}

function Row({ label, cells, weeks, week }) {
  return (
    <>
      <span className={styles.gridLabel}>{label}</span>
      {cells.map((on, i) => (
        <span
          key={weeks[i]}
          className={`${styles.cell} ${on ? styles.cellOn : ''} ${weeks[i] === week ? styles.cellNow : ''}`}
          aria-label={`${label} week ${weeks[i]}: ${on ? 'done' : 'not logged'}`}
        />
      ))}
    </>
  );
}
