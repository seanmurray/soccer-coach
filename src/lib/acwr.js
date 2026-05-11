// Acute-to-chronic workload ratio.
//
// REFERENCE: Gabbett 2016 — running 7d:28d ratio of sessional load. Best-
// validated injury-risk predictor in team sport. "Sweet spot" 0.8-1.3; >1.5
// flags a sharp ramp; <0.5 flags significant detraining.
//
// LOAD MODEL: Foster session-RPE × duration in minutes (classic sRPE).
//   load = session_rpe × duration_min
// If duration is unknown or implausible (<5 min, >180 min), fall back to a
// default 45 min — better than dropping the session entirely.
//
// CHRONIC LOAD: 28-day rolling sum ÷ 4 (weekly average).
// ACUTE LOAD:   7-day rolling sum.

const DEFAULT_DURATION_MIN = 45;
const MIN_REASONABLE_MIN = 5;
const MAX_REASONABLE_MIN = 180;

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Pull a duration estimate from a soccer_sessions row. Uses created_at and
// metadata.session_started_at if both are present; otherwise default.
function durationFromRow(row) {
  const startedAt = row?.metadata?.session_started_at;
  if (!startedAt || !row.created_at) return DEFAULT_DURATION_MIN;
  const start = new Date(startedAt).getTime();
  const end = new Date(row.created_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return DEFAULT_DURATION_MIN;
  const min = (end - start) / MS_PER_MIN;
  if (min < MIN_REASONABLE_MIN || min > MAX_REASONABLE_MIN) return DEFAULT_DURATION_MIN;
  return min;
}

function loadFromRow(row) {
  const rpe = Number(row.session_rpe ?? 7);
  return rpe * durationFromRow(row);
}

// Returns { acute, chronic, ratio, zone, daysOfData, samples } given an array
// of soccer_sessions rows (any time range — we'll filter to 28 days here).
//
// zone: 'idle' (no data), 'low' (<0.5), 'ok' (0.5-1.3), 'caution' (1.3-1.5),
// 'high' (>1.5).
export function computeACWR(sessions, now = Date.now()) {
  const acuteStart = now - 7 * MS_PER_DAY;
  const chronicStart = now - 28 * MS_PER_DAY;

  let acute = 0;
  let chronic = 0;
  let samples = 0;

  for (const s of sessions) {
    const dateStr = s.performed_at;
    if (!dateStr) continue;
    // performed_at is a 'YYYY-MM-DD' date column — anchor at noon UTC to
    // avoid timezone-edge skew when comparing to "now".
    const [y, m, d] = dateStr.split('-').map(Number);
    const ts = Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12);
    if (ts < chronicStart) continue;

    const load = loadFromRow(s);
    chronic += load;
    if (ts >= acuteStart) acute += load;
    samples += 1;
  }

  const chronicWeekly = chronic / 4;
  let ratio = null;
  let zone = 'idle';
  if (samples >= 2 && chronicWeekly > 0) {
    ratio = acute / chronicWeekly;
    if (ratio < 0.5) zone = 'low';
    else if (ratio <= 1.3) zone = 'ok';
    else if (ratio <= 1.5) zone = 'caution';
    else zone = 'high';
  }

  return {
    acute: Math.round(acute),
    chronic: Math.round(chronic),
    chronicWeekly: Math.round(chronicWeekly),
    ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
    zone,
    samples,
  };
}

// Short narrative + the action it suggests.
export function acwrNarrative(zone, ratio) {
  switch (zone) {
    case 'idle':
      return { headline: 'Not enough data yet', text: 'Log a few sessions to see your training load trend.' };
    case 'low':
      return { headline: 'Undertrained', text: `Load is ${ratio?.toFixed(2)}× recent average. Push if readiness permits — you have headroom.` };
    case 'ok':
      return { headline: 'Safe range', text: `Load is ${ratio?.toFixed(2)}× recent average — sweet spot for adaptation without injury risk.` };
    case 'caution':
      return { headline: 'Ramping fast', text: `Load is ${ratio?.toFixed(2)}× recent average. Approaching the high-risk threshold — finish the week as planned, then deload.` };
    case 'high':
      return { headline: 'High risk', text: `Load is ${ratio?.toFixed(2)}× recent average. Above 1.5× is when injuries spike — bias toward recovery today.` };
    default:
      return { headline: '', text: '' };
  }
}
