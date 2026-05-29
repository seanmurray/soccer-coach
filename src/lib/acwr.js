// Acute-to-chronic workload ratio.
//
// REFERENCE: Gabbett 2016 — running 7d:28d ratio of sessional load.
//
// IMPORTANT — interpret as a trend signal, NOT an injury oracle. A 2025
// systematic review + a 10-month RCT found ACWR-based load management
// produced no injury reduction, and that the ratio "magnifies the effect
// of acute workload without adding meaningful predictive value" (noise,
// spurious correlation). So: we lead with ABSOLUTE weekly load and a
// rising/steady/easing trend; the ratio is shown as secondary context
// with deliberately descriptive (not risk-scored) language.
//
// LOAD MODEL — one unit for everything (Foster session-RPE × minutes)
//   Soccer sessions: session_rpe × duration_min  (classic sRPE)
//   Workouts (HealthKit): Σ(minutes_in_zone × Foster RPE-equivalent), see
//     lib/trimp.js workoutLoad — deliberately the SAME unit as sRPE×min.
//
//   Because both sides are RPE×min, the COMBINED total and its ratio are
//   directly meaningful (no mixed-scale artifact). We still keep a separate
//   SOCCER-ONLY view so the user can compare today vs. their historical
//   soccer baseline cleanly.
//
// If duration is unknown or implausible (<5 min, >180 min), fall back to a
// default 45 min for soccer — better than dropping the session entirely.
//
// CHRONIC LOAD: 28-day rolling sum ÷ 4 (weekly average).
// ACUTE LOAD:   7-day rolling sum.

import { workoutLoad } from './trimp';

const DEFAULT_DURATION_MIN = 45;
const MIN_REASONABLE_MIN = 5;
const MAX_REASONABLE_MIN = 180;

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Pull a duration estimate from a soccer_sessions row.
//
// Prefer metadata.session_ended_at (stamped when "Finish Session" is tapped)
// over created_at. created_at is the row-INSERT time, which includes however
// long the post-session debrief sheet sat open — using it silently inflated
// session duration, and therefore acute load and the ACWR ratio. Fall back to
// created_at for legacy rows saved before session_ended_at was captured.
function durationFromRow(row) {
  const startedAt = row?.metadata?.session_started_at;
  const endedAt = row?.metadata?.session_ended_at ?? row?.created_at;
  if (!startedAt || !endedAt) return DEFAULT_DURATION_MIN;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return DEFAULT_DURATION_MIN;
  const min = (end - start) / MS_PER_MIN;
  if (min < MIN_REASONABLE_MIN || min > MAX_REASONABLE_MIN) return DEFAULT_DURATION_MIN;
  return min;
}

function loadFromRow(row) {
  const rpe = Number(row.session_rpe ?? 7);
  return rpe * durationFromRow(row);
}

// Compute the acute/chronic/ratio for a list of {ts, load} entries.
// Pulled out so we can run it independently for soccer-only and combined
// totals without duplicating window math.
function _acwr(entries, now) {
  const acuteStart = now - 7 * MS_PER_DAY;
  const chronicStart = now - 28 * MS_PER_DAY;

  let acute = 0;
  let chronic = 0;
  let samples = 0;
  for (const e of entries) {
    if (e.ts < chronicStart) continue;
    chronic += e.load;
    if (e.ts >= acuteStart) acute += e.load;
    samples += 1;
  }

  const chronicWeekly = chronic / 4;
  let ratio = null;
  let zone = 'idle';
  let trend = 'steady';
  if (samples >= 2 && chronicWeekly > 0) {
    ratio = acute / chronicWeekly;
    if (ratio < 0.5) zone = 'low';
    else if (ratio <= 1.3) zone = 'ok';
    else if (ratio <= 1.5) zone = 'caution';
    else zone = 'high';

    if (acute > chronicWeekly * 1.1) trend = 'rising';
    else if (acute < chronicWeekly * 0.9) trend = 'easing';
    else trend = 'steady';
  }

  return {
    acute: Math.round(acute),
    chronic: Math.round(chronic),
    chronicWeekly: Math.round(chronicWeekly),
    ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
    zone,
    trend,
    samples,
  };
}

// performed_at ('YYYY-MM-DD') → ms timestamp anchored at local noon. Local
// noon avoids timezone-edge skew when comparing to "now."
function tsFromPerformedAt(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12);
}

// Compute ACWR for soccer sessions only AND a combined view that adds
// workout TRIMP load to the soccer load.
//
// Backwards compatible: if called with just an array of sessions (the v1
// signature), returns the flat shape consumers like ACWRCard already use.
// If called with `{ sessions, workouts }`, returns
// `{ ...soccerShape, combined: {acute,chronic,...}, workoutCount }`.
//
// zone: 'idle' (no data), 'low' (<0.5), 'ok' (0.5-1.3), 'caution' (1.3-1.5),
// 'high' (>1.5).
export function computeACWR(input, now = Date.now()) {
  // Normalize signature so we can accept the legacy array form OR the
  // new {sessions, workouts, hrMax} object form.
  const sessions = Array.isArray(input) ? input : (input?.sessions ?? []);
  const workouts = Array.isArray(input) ? [] : (input?.workouts ?? []);
  const hrMax = Array.isArray(input) ? undefined : input?.hrMax;
  const restHr = Array.isArray(input) ? undefined : input?.restHr;

  const sessionEntries = [];
  for (const s of sessions) {
    const ts = tsFromPerformedAt(s.performed_at);
    if (ts == null) continue;
    sessionEntries.push({ ts, load: loadFromRow(s) });
  }

  const workoutEntries = [];
  for (const w of workouts) {
    // Linked workouts are folded into a same-day soccer_session via
    // session_id (auto-assigned at ingest by push-workout). Don't double-
    // count: the session's sRPE × duration already captures the effort
    // the user logged. Workout-as-source-of-truth-for-cond happens
    // downstream in the CNS budget breakdown, not in ACWR.
    if (w.session_id) continue;
    const ts = tsFromPerformedAt(w.performed_at);
    if (ts == null) continue;
    // Foster load (same sRPE×min unit as soccer sessions) from time-in-zone,
    // else from avg HR. One unit → combined total + ratio stay meaningful.
    const opts = {};
    if (hrMax) opts.hrMax = hrMax;
    if (restHr) opts.restHr = restHr;
    const load = workoutLoad(w, opts);
    if (!Number.isFinite(load) || load <= 0) continue;
    workoutEntries.push({ ts, load });
  }

  const soccer = _acwr(sessionEntries, now);
  const combined = _acwr([...sessionEntries, ...workoutEntries], now);

  // Keep the flat soccer-only fields at the top level for backwards compat
  // with existing ACWRCard consumers. Combined sits alongside.
  return {
    ...soccer,
    combined,
    workoutCount: workoutEntries.length,
  };
}

// Descriptive narrative — trend language, not risk scoring. The ratio is
// reported as context, not as a safety verdict (see header note).
export function acwrNarrative(zone, ratio) {
  switch (zone) {
    case 'idle':
      return { headline: 'Not enough data yet', text: 'Log a few sessions to see your training-load trend.' };
    case 'low':
      return { headline: 'Light week', text: `This week is running about ${ratio?.toFixed(2)}× your 4-week average — well below your norm. Fine if it's a deload; otherwise you have headroom to push.` };
    case 'ok':
      return { headline: 'Steady', text: `This week tracks close to your 4-week average (${ratio?.toFixed(2)}×). Load is consistent — keep building.` };
    case 'caution':
      return { headline: 'Climbing', text: `This week is ${ratio?.toFixed(2)}× your 4-week average — a noticeable jump. Not an injury verdict (the ratio isn't a reliable predictor), but a sharp ramp is worth a lighter day before pushing on.` };
    case 'high':
      return { headline: 'Sharp ramp', text: `This week is ${ratio?.toFixed(2)}× your 4-week average — a steep increase. The ratio alone doesn't predict injury, but a jump this size usually means recent absolute load is worth easing for a session or two.` };
    default:
      return { headline: '', text: '' };
  }
}

const TREND_LABEL = {
  rising: 'load rising vs 4-wk avg',
  steady: 'load steady vs 4-wk avg',
  easing: 'load easing vs 4-wk avg',
};

export function acwrTrendLabel(trend) {
  return TREND_LABEL[trend] ?? TREND_LABEL.steady;
}
