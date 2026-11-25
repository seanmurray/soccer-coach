import styles from './ui.module.css';

// Growing-bar scale: a row of bars that get taller left → right. Tapping one
// selects it and lights every bar up to it. The selected option's word +
// one-line description sit above the bars.
//
// options: [{ value, label, desc? }] in ascending order.
export function BarScale({ question, options, value, onChange, lowLabel, highLabel }) {
  const idx = options.findIndex((o) => o.value === value);
  const cur = idx >= 0 ? options[idx] : null;
  const n = options.length;

  return (
    <div className={styles.card}>
      {question && <div className={styles.question}>{question}</div>}
      <div className={styles.scaleWord}>{cur?.label ?? '—'}</div>
      <div className={styles.scaleDesc}>{cur?.desc ?? ' '}</div>
      <div className={styles.bars} role="radiogroup" aria-label={question}>
        {options.map((o, i) => {
          // Heights grow from 34% to 100%; widths grow a little too.
          const h = 34 + (66 * i) / Math.max(1, n - 1);
          const lit = idx >= 0 && i <= idx;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={o.value === value}
              aria-label={o.label}
              className={`${styles.bar} ${lit ? styles.barLit : ''} ${i === idx ? styles.barOn : ''}`}
              style={{ height: `${h}%` }}
              onClick={() => onChange(o.value)}
            />
          );
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className={styles.scaleEnds}>
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}
