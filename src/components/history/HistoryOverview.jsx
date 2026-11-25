import { useState } from 'react';
import styles from './History.module.css';
import { Icon } from '../ui/Icon';
import { useHistoryRange, useSessionDates } from '../../hooks/useHistoryStats';
import { rangeStart, weekKey, tonnage, ymd } from '../../lib/dashboard';

const RANGES = ['1W', '1M', '6M', '1Y', 'All'];
const RANGE_LABEL = { '1W': 'Last 7 days', '1M': 'Last month', '6M': 'Last 6 months', '1Y': 'Last year', All: 'All time' };

const fmtLb = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));

// Sessions overview at the top of History: total volume + session tiles for
// the chosen range, a volume bar chart (per day for 1W, per week otherwise),
// and a calendar / list toggle. Volume = Σ weight × reps of logged sets
// (seconds-based sets excluded) — real numbers only.
export function HistoryOverview({ view, onViewChange, onPickSession }) {
  const [range, setRange] = useState('6M');
  const start = rangeStart(range);
  const { data, isLoading } = useHistoryRange(start);

  const sessions = data?.sessions ?? [];
  const sets = data?.sets ?? [];
  const total = tonnage(sets);
  const rpes = sessions.map((s) => s.session_rpe).filter((v) => v != null);
  const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : null;

  const bars = buildBars(range, start, sets);

  return (
    <div>
      <div className={styles.tiles}>
        <div className={styles.tile}>
          <Icon name="bolt" size={20} className={styles.tileIcon} />
          <div className={styles.tileLabel}>Total volume</div>
          <div className={styles.tileValue}>{isLoading ? '—' : `${fmtLb(total)} lb`}</div>
          <div className={styles.tileSub}>{RANGE_LABEL[range]}</div>
        </div>
        <div className={styles.tile}>
          <Icon name="calendar" size={20} className={styles.tileIcon} />
          <div className={styles.tileLabel}>Sessions</div>
          <div className={styles.tileValue}>{isLoading ? '—' : sessions.length}</div>
          <div className={styles.tileSub}>{avgRpe ? `avg RPE ${avgRpe}` : 'no RPE logged'}</div>
        </div>
      </div>

      <div className={styles.ranges} role="tablist" aria-label="Range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            className={`${styles.range} ${range === r ? styles.rangeOn : ''}`}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <BarChart bars={bars} />
      <div className={styles.legend}>
        <span className={styles.legendDot} /> Volume per {range === '1W' ? 'day' : 'week'} (lb)
      </div>

      <div className={styles.viewRow}>
        <div className={styles.viewCount}>{sessions.length} session{sessions.length === 1 ? '' : 's'} · {RANGE_LABEL[range].toLowerCase()}</div>
        <div className={styles.viewToggle}>
          <button type="button" className={`${styles.viewBtn} ${view === 'calendar' ? styles.viewOn : ''}`} onClick={() => onViewChange('calendar')} aria-label="Calendar view" aria-pressed={view === 'calendar'}>
            <Icon name="calendar" size={20} />
          </button>
          <button type="button" className={`${styles.viewBtn} ${view === 'list' ? styles.viewOn : ''}`} onClick={() => onViewChange('list')} aria-label="List view" aria-pressed={view === 'list'}>
            <Icon name="list" size={20} />
          </button>
        </div>
      </div>

      {view === 'calendar' && <MonthCalendar onPickSession={onPickSession} />}
    </div>
  );
}

// Buckets: one per day for 1W, one per Monday-week otherwise. For "All" the
// buckets start at the first logged set.
function buildBars(range, start, sets) {
  const byDay = range === '1W';
  const keyOf = (d) => (byDay ? d : weekKey(d));
  const sums = new Map();
  for (const s of sets) {
    const k = keyOf(s.performed_at);
    sums.set(k, (sums.get(k) ?? 0) + tonnage([s]));
  }
  const first = start ?? sets[0]?.performed_at;
  if (!first) return [];
  const out = [];
  const [y, m, d] = keyOf(first).split('-').map(Number);
  const cur = new Date(y, m - 1, d);
  const today = new Date();
  while (cur <= today && out.length < 400) {
    const k = ymd(cur);
    out.push({ key: k, value: sums.get(k) ?? 0, date: new Date(cur) });
    cur.setDate(cur.getDate() + (byDay ? 1 : 7));
  }
  return out;
}

function BarChart({ bars }) {
  const W = 360, H = 150, padR = 34, padB = 20, padT = 8;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const n = Math.max(1, bars.length);
  const slot = (W - padR) / n;
  const bw = Math.max(2, Math.min(26, slot * 0.62));
  const y = (v) => padT + (H - padB - padT) * (1 - v / max);
  const ticks = [0, max / 2, max];
  // Month labels at the first bar of each month (max ~5 to avoid crowding).
  const labels = [];
  let lastMonth = -1;
  bars.forEach((b, i) => {
    const mo = b.date.getMonth();
    if (mo !== lastMonth) { labels.push({ i, text: b.date.toLocaleDateString(undefined, n <= 8 ? { weekday: 'short' } : { month: 'short' }) }); lastMonth = mo; }
  });
  const step = Math.ceil(labels.length / 5);

  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Training volume chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={0} x2={W - padR} y1={y(t)} y2={y(t)} className={styles.gridLine} />
          <text x={W - padR + 4} y={y(t) + 4} className={styles.axis}>{fmtLb(t)}</text>
        </g>
      ))}
      {bars.map((b, i) => (
        <rect
          key={b.key}
          x={i * slot + (slot - bw) / 2}
          y={y(b.value)}
          width={bw}
          height={Math.max(0, H - padB - y(b.value))}
          rx={Math.min(5, bw / 3)}
          className={b.value > 0 ? styles.bar : styles.barZero}
        />
      ))}
      {(n <= 8 ? bars.map((b, i) => ({ i, text: b.date.toLocaleDateString(undefined, { weekday: 'short' }) })) : labels.filter((_, k) => k % step === 0)).map((l) => (
        <text key={l.i} x={l.i * slot + slot / 2} y={H - 4} textAnchor="middle" className={styles.axis}>{l.text}</text>
      ))}
    </svg>
  );
}

function MonthCalendar({ onPickSession }) {
  const { data: dates } = useSessionDates();
  const [offset, setOffset] = useState(0); // months back from now
  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() - offset, 1);
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = month.getDay(); // Sunday-start, like the reference

  const byDate = new Map();
  for (const s of dates ?? []) if (!byDate.has(s.performed_at)) byDate.set(s.performed_at, s);
  const todayKey = ymd(new Date());

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  return (
    <div className={styles.cal}>
      <div className={styles.calHead}>
        <button type="button" className={styles.calNav} onClick={() => setOffset((o) => o + 1)} aria-label="Previous month">‹</button>
        <div className={styles.calTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
        <button type="button" className={styles.calNav} onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Next month">›</button>
      </div>
      <div className={styles.calGrid}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => <div key={w} className={styles.calDow}>{w}</div>)}
        {cells.map((c, i) => {
          if (!c) return <div key={`b${i}`} />;
          const k = ymd(c);
          const session = byDate.get(k);
          return (
            <button
              key={k}
              type="button"
              className={`${styles.calDay} ${session ? styles.calDayOn : ''} ${k === todayKey ? styles.calToday : ''}`}
              onClick={() => session && onPickSession(session.id)}
              disabled={!session}
              aria-label={`${c.toDateString()}${session ? ' — session logged' : ''}`}
            >
              {c.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
