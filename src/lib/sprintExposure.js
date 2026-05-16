// Sprint exposure — tracks high-speed running as a PROTECTIVE dose, not a cost.
//
// Why this is its own metric (separate from CNS budget, which treats sprint
// work purely as fatigue): the soccer literature shows chronic UNDER-exposure
// to true high-speed running raises soft-tissue (hamstring) injury risk.
// Athletes who regularly sprint near max speed are injured LESS, not more.
// CNS budget answers "have I done too much?" — this answers the opposite,
// equally important question: "have I done enough top-speed work lately?"
// At 44, an under-exposed posterior chain is exactly the thing that tears.
//
// WHAT COUNTS AS A HIGH-SPEED EXPOSURE (per user choice "vel + sprint-cond"):
//   - any max-velocity day  (day_type === 'vel'), OR
//   - a conditioning protocol that is true high-speed running:
//       treadmill_rsa, curved_tm_sprint, court_sprint_repeats,
//       bike_court_combo, bangsbo_speed_endurance, thirty_fifteen_ift
//   Norwegian 4×4 / bike tabata / rower / SkiErg / Zone 2 do NOT count —
//   they're metabolic, not top-speed running.
//
// DOSE (7-day rolling, distinct days):
//   0          under   — under-exposed; injury-risk direction. Get one in.
//   1-2        ok       — protective range.
//   ≥ 3        high     — plenty of speed work; cross-check CNS budget.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const SPRINT_COND_KEYS = new Set([
  'treadmill_rsa',
  'curved_tm_sprint',
  'court_sprint_repeats',
  'bike_court_combo',
  'bangsbo_speed_endurance',
  'thirty_fifteen_ift',
]);

const dateToTs = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12);
};

// Inputs:
//   sessions — soccer_sessions rows (last ~14 days): { id, performed_at, day_type }
//   perf     — soccer_exercise_perf rows joined to those: { session_id, exercise_key }
//   now      — Date.now() for testing
export function computeSprintExposure({ sessions = [], perf = [], now = Date.now() }) {
  const sevenDayStart = now - 7 * MS_PER_DAY;

  const sprintSessionIds = new Set(
    perf.filter((p) => SPRINT_COND_KEYS.has(p.exercise_key)).map((p) => p.session_id)
  );

  // Distinct exposure days (a day with vel work or sprint-cond work).
  const exposureDays = new Set();          // 'YYYY-MM-DD' within window
  const exposureDaysLast7 = new Set();
  let lastExposureTs = null;

  for (const s of sessions) {
    const ts = dateToTs(s.performed_at);
    if (ts == null) continue;
    const isExposure = s.day_type === 'vel' || sprintSessionIds.has(s.id);
    if (!isExposure) continue;

    exposureDays.add(s.performed_at);
    if (ts >= sevenDayStart) exposureDaysLast7.add(s.performed_at);
    if (lastExposureTs == null || ts > lastExposureTs) lastExposureTs = ts;
  }

  const count7 = exposureDaysLast7.size;
  const daysSinceLast =
    lastExposureTs == null ? null : Math.floor((now - lastExposureTs) / MS_PER_DAY);

  let zone = 'ok';
  if (count7 === 0) zone = 'under';
  else if (count7 >= 3) zone = 'high';

  return {
    count7,
    daysSinceLast,
    zone,
    sessionCount: sessions.length,
  };
}

export function sprintExposureNarrative(zone, count7, daysSinceLast) {
  switch (zone) {
    case 'under': {
      const since =
        daysSinceLast == null
          ? 'No true high-speed running on record yet.'
          : `${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'} since your last true sprint exposure.`;
      return {
        headline: 'Under-exposed',
        text: `${since} Chronic under-exposure to top-speed running is itself a hamstring-injury risk — it's not just fatigue that tears tissue, it's tissue that never sees speed. Get a max-velocity or sprint-RSA session in.`,
      };
    }
    case 'high':
      return {
        headline: 'High volume',
        text: `${count7} high-speed exposures in the last 7 days. Speed work is protective, but you're past the minimum dose — cross-check the CNS budget card before stacking more.`,
      };
    case 'ok':
    default:
      return {
        headline: 'Protective range',
        text: `${count7} high-speed exposure${count7 === 1 ? '' : 's'} in the last 7 days. This is the range that lowers soft-tissue injury risk — keep one to two true sprint sessions in each week.`,
      };
  }
}
