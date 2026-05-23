// Conditioning protocols — metric registry.
//
// Each protocol that's tracked over time has an entry here keyed by its
// stable `exercise_key`. The metric def drives:
//   - The input UI (which card variant, what label, what unit)
//   - The Progress chart axis label + "best" direction
//   - PR detection (higher-is-better vs lower-is-better)
//
// HIGHER-IS-BETTER metrics:
//   mph, W (watts), level (for the 30-15 IFT final stage)
// LOWER-IS-BETTER metrics:
//   sec (per-rep sprint time), sec/500m (rower / SkiErg split), sec total
//
// Pace inputs (sec/500m) accept mm:ss in the UI; we store decimal seconds.

export const CONDITIONING_METRICS = {
  norwegian_4x4: {
    label: 'Avg work mph',
    unit: 'mph',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 4, max: 14, step: 0.1,
  },
  bangsbo_speed_endurance: {
    label: 'Avg work mph',
    unit: 'mph',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 6, max: 18, step: 0.1,
  },
  thirty_fifteen_ift: {
    label: 'Top stage speed',
    unit: 'mph',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 5, max: 16, step: 0.1,
  },
  treadmill_rsa: {
    label: 'Avg sprint mph',
    unit: 'mph',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 6, max: 18, step: 0.1,
  },
  curved_tm_sprint: {
    label: 'Avg sprint mph',
    unit: 'mph',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 6, max: 18, step: 0.1,
  },
  court_sprint_repeats: {
    label: 'Avg sprint time',
    unit: 'sec',
    higherIsBetter: false,
    inputMode: 'decimal',
    min: 3, max: 12, step: 0.1,
  },
  skierg_1on2off: {
    label: 'Avg 500m split',
    unit: 'sec',
    displayUnit: 'sec/500m',
    higherIsBetter: false,
    inputMode: 'pace', // mm:ss
    min: 60, max: 240, step: 1,
  },
  rower_500m_repeats: {
    label: 'Avg 500m split',
    unit: 'sec',
    displayUnit: 'sec/500m',
    higherIsBetter: false,
    inputMode: 'pace',
    min: 60, max: 240, step: 1,
  },
  assault_bike_tabata: {
    label: 'Avg watts',
    unit: 'W',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 100, max: 800, step: 5,
  },
  bike_court_combo: {
    label: 'Total time',
    unit: 'sec',
    higherIsBetter: false,
    inputMode: 'decimal',
    min: 120, max: 1200, step: 1,
  },
  treadmill_zone2: {
    label: 'Avg mph',
    unit: 'mph',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 3, max: 10, step: 0.1,
  },
  treadmill_zone2_easy: {
    label: 'Avg mph',
    unit: 'mph',
    higherIsBetter: true,
    inputMode: 'decimal',
    min: 3, max: 8, step: 0.1,
  },
};

export const isConditioningKey = (k) =>
  k in CONDITIONING_METRICS || k.startsWith('cond_');

// Protocols whose prescription is a RANGE or a TEST (variable end time).
// For these, pace alone doesn't capture the dose — the user should also log
// duration. Fixed-duration protocols (Norwegian 4×4 ≈ 40 min, RSA 1:1 ×10,
// rower 4×500m, etc.) don't need a duration input.
export const VAR_DURATION_KEYS = new Set([
  'treadmill_zone2',          // 20-30 min
  'treadmill_zone2_easy',     // 15-20 min
  'bangsbo_speed_endurance',  // 6 rounds ≈ 18 min total but timed work varies
  'thirty_fifteen_ift',       // graded test, ends when you can't hold the stage
  'bike_court_combo',         // 4 rounds, total elapsed varies
]);

// Suggested placeholder per protocol (sensible midpoint of the prescribed
// range). Falls back to a generic hint.
export const DURATION_HINT = {
  treadmill_zone2: '25',
  treadmill_zone2_easy: '18',
  bangsbo_speed_endurance: '18',
  thirty_fifteen_ift: '10',
  bike_court_combo: '10',
};

// Returns the metric def for a conditioning exercise key, or null if it
// has no registered metric (= the protocol is logged as picked but no
// measurement is captured).
export function metricFor(exerciseKey) {
  return CONDITIONING_METRICS[exerciseKey] ?? null;
}

// Format a stored value back into the user-facing display, respecting pace
// formatting for mm:ss metrics.
export function formatMetricValue(value, metric) {
  if (value == null || !metric) return '—';
  if (metric.inputMode === 'pace') {
    const secs = Math.round(value);
    const mm = Math.floor(secs / 60);
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// Parse user input back into decimal seconds (for pace) or float (for decimal).
// Returns null on bad input.
export function parseMetricInput(raw, metric) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (metric.inputMode === 'pace') {
    // Accept "1:45", "1:45.5", or plain "105" (already in seconds).
    if (s.includes(':')) {
      const [mm, ss] = s.split(':');
      const m = Number(mm);
      const sec = Number(ss);
      if (!Number.isFinite(m) || !Number.isFinite(sec)) return null;
      return m * 60 + sec;
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
