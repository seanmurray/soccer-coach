import styles from './Common.module.css';

export function AiInsightCard({ label = 'Coach Insight', loading, children }) {
  return (
    <div className={styles.aiCard} role="status" aria-live="polite">
      <div className={styles.aiLabel}>{label}</div>
      <div className={styles.aiText}>
        {loading ? (
          <>
            <span className="dot" /><span className="dot" /><span className="dot" />
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
