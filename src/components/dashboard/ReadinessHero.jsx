import styles from './Dashboard.module.css';
import { useSessions } from '../../hooks/useSessions';
import { useSessionStore } from '../../stores/sessionStore';
import { MODE_DATA } from '../../data/sessions';
import { sessionReadiness } from '../../lib/dashboard';
import { formatDate } from '../../lib/dateFormat';

const MODE_TONE = {
  full: 'var(--green)',
  mod1: 'var(--mode-mod1-fg)',
  mod2: 'var(--amber)',
  mod3: 'var(--orange)',
  recovery: 'var(--red)',
};

// Readiness hero: the latest logged session's readiness score (0-100, the
// same composite computeMode uses to pick the training mode), the mode it
// produced, the change vs the session before, and a trend line over the
// last 10 sessions. Every number is computed from saved check-in inputs
// (see sessionReadiness for how older rows are re-scored).
export function ReadinessHero() {
  const { data: sessions, isLoading } = useSessions();
  const baseline = useSessionStore((s) => s._readinessBaseline);

  const scored = (sessions ?? [])
    .map((row) => ({ row, r: sessionReadiness(row, baseline) }))
    .filter((x) => x.r);
  if (isLoading) {
    return (
      <div className={styles.hero} aria-busy="true">
        <div className={styles.heroKicker}>Readiness</div>
        <div className={styles.heroScoreRow}>
          <div className={`${styles.heroScore} ${styles.heroLoading}`}>––</div>
          <div className={styles.heroOutOf}>/100</div>
        </div>
      </div>
    );
  }
  if (scored.length === 0) {
    return (
      <div className={styles.hero}>
        <div className={styles.heroKicker}>Readiness</div>
        <div className={styles.heroEmpty}>Finish a workout check-in and your readiness shows here.</div>
      </div>
    );
  }

  const [latest, prev] = scored;
  const delta = prev ? Math.round(latest.r.score - prev.r.score) : null;
  const mode = MODE_DATA[latest.r.mode] ?? MODE_DATA.full;
  const tone = MODE_TONE[latest.r.mode] ?? 'var(--accent-hi)';
  const trend = scored.slice(0, 10).reverse();

  return (
    <div className={styles.hero}>
      <div className={styles.heroTop}>
        <div className={styles.heroKicker}>Readiness · {formatDate(latest.row.performed_at)}</div>
        <div className={styles.heroWindow}>Full ≥ 72</div>
      </div>
      <div className={styles.heroScoreRow}>
        <div className={styles.heroScore}>{Math.round(latest.r.score)}</div>
        <div className={styles.heroOutOf}>/100</div>
        {delta != null && (
          <div className={styles.heroDelta}>
            <span>{delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta)}</span>
            <span className={styles.heroDeltaSub}>vs previous</span>
          </div>
        )}
      </div>
      <div className={styles.heroMode} style={{ color: tone }}>{mode.label}</div>
      <div className={styles.heroSub}>{mode.sub}</div>
      {trend.length > 1 && <Sparkline points={trend.map((t) => t.r.score)} />}
    </div>
  );
}

function Sparkline({ points }) {
  const W = 300, H = 56, pad = 6;
  const n = points.length;
  const x = (i) => pad + (i * (W - pad * 2)) / (n - 1);
  const y = (v) => H - pad - ((Math.max(0, Math.min(100, v)) - 20) / 80) * (H - pad * 2);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <div className={styles.spark}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Readiness over the last sessions">
        <line x1={pad} x2={W - pad} y1={y(72)} y2={y(72)} className={styles.sparkRef} />
        <path d={d} className={styles.sparkLine} />
        {points.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === n - 1 ? 4 : 2.4} className={i === n - 1 ? styles.sparkDotOn : styles.sparkDot} />
        ))}
      </svg>
      <div className={styles.sparkLegend}>
        <span>Last {n} sessions</span>
        <span className={styles.sparkRefLabel}>— full-training line</span>
      </div>
    </div>
  );
}
