import styles from './Segmented.module.css';

// Full-width segmented control: equal-width options, the selected one filled
// with the accent. `options` is [{ id, label }].
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className={styles.seg} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className={`${styles.opt} ${value === o.id ? styles.active : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
