// Apple-style fillable ring for the weekly training-days goal.
export function WeeklyRing({ value, goal, size = 132, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const hit = value >= goal;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--bg-raised)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={hit ? 'var(--green)' : 'var(--blue)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.6s var(--ease-spring), stroke 0.3s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: 'var(--t1)' }}>
          {value}<span style={{ color: 'var(--t3)', fontSize: 26 }}>/{goal}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t3)', marginTop: 2 }}>
          {hit ? 'Goal! 🎉' : 'this week'}
        </div>
      </div>
    </div>
  );
}
