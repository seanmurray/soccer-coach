import styles from './flow.module.css';

// Top bar for the workout flow steps: round back button, a centered two-line
// context label (e.g. "Acceleration / Week 3 · Warm-up"), optional right slot.
export function FlowHeader({ onBack, title, sub, right }) {
  return (
    <div className={styles.flowHeader}>
      {onBack ? (
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Back">‹</button>
      ) : <span className={styles.backSpacer} />}
      <div className={styles.flowTitle}>
        {title && <div className={styles.flowTitleMain}>{title}</div>}
        {sub && <div className={styles.flowTitleSub}>{sub}</div>}
      </div>
      <div className={styles.flowRight}>{right}</div>
    </div>
  );
}
