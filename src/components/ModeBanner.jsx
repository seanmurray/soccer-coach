import styles from './ModeBanner.module.css';
import { MODE_DATA } from '../data/sessions';

export function ModeBanner({ mode }) {
  const data = MODE_DATA[mode] ?? MODE_DATA.full;
  return (
    <div className={`${styles.banner} ${styles[mode] ?? styles.full}`}>
      <div>
        <div className={styles.label}>{data.label}</div>
        <div className={styles.sub}>{data.sub}</div>
      </div>
      <div className={styles.emoji} aria-hidden>{data.emoji}</div>
    </div>
  );
}
