import styles from './ui.module.css';
import { NumField } from '../NumField';

// Big-number stepper card: label on top, − [value] + in the middle, optional
// hint underneath. The number itself is a text field (tap to type) so you're
// never stuck tapping + forty times to get from 135 to 225.
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  decimal = false,
  unit,
  hint,
  placeholder = '—',
  disabled = false,
  headerRight,
}) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const bump = (dir) => {
    if (disabled) return;
    const base = value ?? (dir > 0 ? min : min);
    // Round to the step so 137 + 5 lands on 140, not 142.
    const next = clamp(Math.round((base + dir * step) / step) * step);
    onChange(Number(next.toFixed(2)));
  };

  return (
    <div className={`${styles.card} ${disabled ? styles.disabled : ''}`}>
      {(label || headerRight) && (
        <div className={styles.cardHead}>
          {label && <div className={styles.cardLabel}>{label}</div>}
          {headerRight}
        </div>
      )}
      <div className={styles.stepRow}>
        <button
          type="button"
          className={styles.roundBtn}
          onClick={() => bump(-1)}
          disabled={disabled}
          aria-label={`Decrease ${label ?? 'value'}`}
        >
          −
        </button>
        <div className={styles.valueWrap}>
          <NumField
            decimal={decimal}
            className={styles.bigInput}
            value={value}
            onChange={(v) => onChange(v == null ? null : clamp(v))}
            placeholder={placeholder}
            aria-label={label}
            disabled={disabled}
          />
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
        <button
          type="button"
          className={styles.roundBtn}
          onClick={() => bump(1)}
          disabled={disabled}
          aria-label={`Increase ${label ?? 'value'}`}
        >
          +
        </button>
      </div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
