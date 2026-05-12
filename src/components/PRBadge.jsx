import styles from './PRBadge.module.css';

// Two display modes:
//   <PRSummaryBadge count={n} /> — single pill for collapsed card header
//   <PRBadgeList prs={...} />     — detailed list for expanded detail view

export function PRSummaryBadge({ count }) {
  if (!count) return null;
  return (
    <span className={styles.summary}>
      <span className={styles.medal} aria-hidden>🏅</span>
      {count} PR{count === 1 ? '' : 's'}
    </span>
  );
}

export function PRBadgeList({ prs }) {
  if (!prs?.length) return null;
  return (
    <div className={styles.list}>
      {prs.map((pr, i) => (
        <span key={i} className={styles.pill}>
          <span className={styles.medal} aria-hidden>🏅</span>
          <span className={styles.label}>{pr.label}</span>
          <span className={styles.value}>{pr.value}</span>
          {pr.delta && <span className={styles.delta}>({pr.delta})</span>}
        </span>
      ))}
    </div>
  );
}
