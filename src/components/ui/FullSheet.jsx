import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ui.module.css';

// Full-screen sheet that slides up over everything (incl. the tab bar):
// pill title top-left, optional header actions + close top-right, scrolling
// body, and an optional pinned footer button.
export function FullSheet({ open, title, onClose, headerActions, footer, children, label }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={styles.sheetRoot} role="dialog" aria-modal="true" aria-label={label ?? title}>
      <div className={styles.sheetTop}>
        {title && <div className={styles.titlePill}>{title}</div>}
        <div className={styles.sheetActions}>
          {headerActions}
          {onClose && (
            <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
      </div>
      <div className={styles.sheetBody}>{children}</div>
      {footer && <div className={styles.sheetFooter}>{footer}</div>}
    </div>,
    document.body
  );
}

// Dark glass pill button used for sheet footers (DONE, Next, Start Workout).
export function PillButton({ children, onClick, disabled, variant, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={`${styles.pillBtn} ${variant === 'accent' ? styles.pillAccent : ''} ${variant === 'danger' ? styles.pillDanger : ''}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

// Two-option toggle (Yes / No) with the selected side filled.
export function YesNo({ question, value, onChange, yesLabel = 'Yes', noLabel = 'No', noFirst = false }) {
  const opts = noFirst
    ? [{ v: false, l: noLabel }, { v: true, l: yesLabel }]
    : [{ v: true, l: yesLabel }, { v: false, l: noLabel }];
  return (
    <div className={styles.card}>
      {question && <div className={styles.cardLabel}>{question}</div>}
      <div className={styles.yesNo}>
        {opts.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            className={`${styles.ynBtn} ${value === o.v ? styles.ynOn : ''}`}
            onClick={() => onChange(o.v)}
            aria-pressed={value === o.v}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

// On/off switch row.
export function SwitchRow({ label, checked, onChange, accent = false }) {
  return (
    <label className={styles.switchRow}>
      <span className={`${styles.switchLabel} ${accent && checked ? styles.switchLabelOn : ''}`}>{label}</span>
      <input
        type="checkbox"
        className={styles.switchInput}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.switchTrack} aria-hidden />
    </label>
  );
}
