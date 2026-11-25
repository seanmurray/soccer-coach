// Pure helpers for the Dashboard + History summaries.

import { computeMode } from './periodization';

// Readiness score (0-100) for a saved session row. New sessions store the
// exact score in metadata; older rows are re-scored from their saved inputs
// with the same computeMode the app used (current personal baseline, so it
// can differ by a point or two from what that day showed).
export function sessionReadiness(row, baseline = null) {
  if (row?.metadata?.readiness_score != null) {
    const s = Number(row.metadata.readiness_score);
    return { score: s, mode: computeMode(scoreInputs(row), baseline).mode };
  }
  const inputs = scoreInputs(row);
  if (Object.values(inputs).every((v) => v == null)) return null;
  const { score, mode } = computeMode(inputs, baseline);
  return { score: Math.round(score), mode };
}

function scoreInputs(row) {
  return {
    rec: row?.recovery_pct ?? null,
    battery: row?.battery_pct ?? null,
    stress: row?.stress_score ?? null,
    body: row?.body_feel ?? null,
    mot: row?.motivation ?? null,
  };
}

// Days × weeks completion grid. Columns are program weeks (oldest → newest)
// ending at the later of the current week pointer and the newest logged
// week; rows follow the user's day order. Returns { weeks, rows } where
// rows = [{ day, cells: [bool…] }].
export function weekGrid(sessions, dayOrder, currentWeek, cols = 10) {
  const logged = new Set((sessions ?? []).map((s) => `${s.week_num}:${s.day_type}`));
  const maxLogged = Math.max(0, ...(sessions ?? []).map((s) => s.week_num ?? 0));
  const end = Math.max(currentWeek ?? 1, maxLogged, 1);
  const start = Math.max(1, end - cols + 1);
  const weeks = [];
  for (let w = start; w <= end; w++) weeks.push(w);
  const rows = dayOrder.map((day) => ({
    day,
    cells: weeks.map((w) => logged.has(`${w}:${day}`)),
  }));
  return { weeks, rows };
}

// Local YYYY-MM-DD for a Date.
export function ymd(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Start date (YYYY-MM-DD, inclusive) for a History range id.
export function rangeStart(range, now = new Date()) {
  const d = new Date(now);
  switch (range) {
    case '1W': d.setDate(d.getDate() - 6); break;
    case '1M': d.setMonth(d.getMonth() - 1); break;
    case '6M': d.setMonth(d.getMonth() - 6); break;
    case '1Y': d.setFullYear(d.getFullYear() - 1); break;
    default: return null; // All
  }
  return ymd(d);
}

// Monday-start week key for bucketing (YYYY-MM-DD of that Monday).
export function weekKey(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // Mon = 0
  dt.setDate(dt.getDate() - dow);
  return ymd(dt);
}

// Tonnage of a set list: Σ weight × reps over rep-based sets with load.
export function tonnage(sets) {
  return (sets ?? []).reduce((sum, s) => {
    if (s.unit === 'secs') return sum;
    const w = Number(s.actual_weight) || 0;
    const r = Number(s.actual_reps) || 0;
    return sum + w * r;
  }, 0);
}
