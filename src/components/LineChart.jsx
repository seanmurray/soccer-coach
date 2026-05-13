import styles from './LineChart.module.css';

// Minimal SVG line chart. Takes a series of { date: 'YYYY-MM-DD', value: n,
// isPR?: bool }; sorts by date, draws a polyline + dots, highlights PRs in
// amber. No deps — keeps the bundle from gaining ~80KB of recharts.
//
// SIZING: scales to its container's width via viewBox; height fixed at 220.
// The y-axis is data-driven (5% headroom above max, snapped at the data
// floor) so small gains read clearly.

const W = 360;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };

const formatMonthDay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1)
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function LineChart({
  title,
  unit = '',
  data = [],
  color = '#30d158',
  emptyHint = 'No data yet — log this metric to see the trend.',
  // For pace / time metrics, lower numbers are better. The chart still
  // plots the raw value (we don't invert the y-axis), but "Best" and the
  // delta sign respect direction.
  higherIsBetter = true,
  // When the metric is mm:ss style, format the summary value as pace.
  formatValue,
}) {
  const sorted = [...data].sort((a, b) => (a.date < b.date ? -1 : 1));

  // Compute the series stats up front so we can show summary text even if
  // the chart itself ends up empty.
  const values = sorted.map((d) => d.value);
  const best = values.length
    ? (higherIsBetter ? Math.max(...values) : Math.min(...values))
    : null;
  const last = values.length ? sorted[sorted.length - 1].value : null;
  const first = values.length ? sorted[0].value : null;
  // Delta = improvement, so lower-is-better metrics flip the sign.
  const delta = first != null && last != null
    ? (higherIsBetter ? last - first : first - last)
    : null;

  const fmt = (n) => {
    if (n == null) return '—';
    if (formatValue) return formatValue(n);
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  };

  if (sorted.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.head}>
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.empty}>{emptyHint}</div>
      </div>
    );
  }

  // y-axis: 5% headroom at top + bottom for visual breathing room.
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const span = Math.max(1, vMax - vMin);
  const yMin = vMin - span * 0.1;
  const yMax = vMax + span * 0.1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xFor = (i) => {
    if (sorted.length === 1) return PAD.left + plotW / 2;
    return PAD.left + (plotW * i) / (sorted.length - 1);
  };
  const yFor = (v) => PAD.top + plotH * (1 - (v - yMin) / (yMax - yMin));

  // Y-axis ticks — 4 evenly spaced.
  const yTicks = Array.from({ length: 4 }, (_, i) => yMin + ((yMax - yMin) * (i + 1)) / 4);
  // X-axis ticks — first, middle, last (date labels would overlap otherwise on narrow viewports).
  const xTickIdx = sorted.length <= 2
    ? sorted.map((_, i) => i)
    : [0, Math.floor((sorted.length - 1) / 2), sorted.length - 1];

  const path = sorted.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.value)}`).join(' ');

  // Format delta string. Direction-aware: + for improvement (regardless of
  // whether higher or lower is better), − for regression.
  const deltaStr = (() => {
    if (delta == null || sorted.length < 2) return null;
    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
    const abs = Math.abs(delta);
    const formatted = formatValue ? formatValue(abs) : abs.toFixed(unit === 'lbs' ? 0 : 1);
    return `${sign}${formatted} ${unit}`;
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.title}>{title}</div>
        <div className={styles.summary}>
          Best <strong>{fmt(best)} {unit}</strong>
          {deltaStr ? <> · {deltaStr} over {sorted.length} sessions</> : null}
        </div>
      </div>

      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={title}>
        {/* gridlines */}
        {yTicks.map((v) => (
          <line key={v} className={styles.gridline}
            x1={PAD.left} x2={W - PAD.right}
            y1={yFor(v)}  y2={yFor(v)} />
        ))}
        {/* y-axis labels */}
        {yTicks.map((v) => (
          <text key={`yl${v}`} className={styles.tick}
            x={PAD.left - 4} y={yFor(v) + 3} textAnchor="end">
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        ))}
        {/* x-axis */}
        <line className={styles.axis}
          x1={PAD.left} x2={W - PAD.right}
          y1={H - PAD.bottom} y2={H - PAD.bottom} />
        {/* x-axis labels */}
        {xTickIdx.map((i) => (
          <text key={`xl${i}`} className={styles.tick}
            x={xFor(i)} y={H - PAD.bottom + 14} textAnchor="middle">
            {formatMonthDay(sorted[i].date)}
          </text>
        ))}

        {/* data path */}
        <path className={styles.line} d={path} stroke={color} />

        {/* points — PR dots use amber fill */}
        {sorted.map((d, i) => (
          <circle key={i}
            cx={xFor(i)} cy={yFor(d.value)} r={d.isPR ? 5 : 3.5}
            className={d.isPR ? styles.dotPR : styles.dot}
            stroke={d.isPR ? '#ffd60a' : color}
          />
        ))}
      </svg>
    </div>
  );
}
