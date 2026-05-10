import styles from './Pills.module.css';
import { DAY_TYPE_INFO } from '../data/sessions';
import { useSettingsStore } from '../stores/settingsStore';
import { useSessionStore } from '../stores/sessionStore';

export function DaySelector() {
  const dayOrder = useSettingsStore((s) => s.dayOrder);
  const dayType = useSessionStore((s) => s.dayType);
  const setDayType = useSessionStore((s) => s.setDayType);

  return (
    <div className="scroll-x" role="tablist" aria-label="Day type">
      {dayOrder.map((d, i) => {
        const info = DAY_TYPE_INFO[d];
        const isActive = dayType === d;
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.dayPill} ${isActive ? styles.active : ''}`}
            onClick={() => setDayType(d)}
          >
            <span className={styles.dayN}>Day {i + 1}</span>
            <span className={styles.dayName}>{info.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
