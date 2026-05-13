// Personal record detection.
//
// Two kinds of PRs we surface:
//
//   e1RM PR  — for the four main strength lifts. PR = the highest single-set
//              estimated 1RM (Brzycki, RIR-adjusted) ever recorded for that
//              lift. Per-session "this session set a PR" = any set in this
//              session produced a higher e1RM than every set logged before
//              the session's date.
//
//   measure PR — for any exercise with a measure value parsed from the perf
//              notes. PR = highest value ever logged for that exercise key.
//              (Always "higher is better" for the metrics we care about
//              today: jump distances, box heights. We'll flip the direction
//              if sprint times land here later.)

import { estimate1RM } from './maxEstimator';
import { parseMeasurement } from './measurementParse';
import { EX_TO_MAX_KEY } from '../data/exercises';
import { metricFor } from '../data/conditioningProtocols';

// Returns the e1RM for a soccer_sets row, or null if the row lacks weight/reps.
function setE1RM(s) {
  const w = Number(s.actual_weight);
  const r = Number(s.actual_reps);
  const rpe = Number(s.rpe);
  if (!w || !r) return null;
  return estimate1RM(w, r, rpe);
}

// Build a date-ordered timeline of best-ever values up to and including
// each session_id. Used to compute "was set X in session Y a PR at the time?".
//
// Inputs: arrays sorted ascending by performed_at (oldest first).
//
// Returns:
//   {
//     e1rmPRs:    { [session_id]: [{ liftKey, value, exerciseKey, exerciseName }] }
//     measurePRs: { [session_id]: [{ exerciseKey, value, unit, exerciseName }] }
//   }
//
// `liftKey` is the working-max key (bench / trapbar / blgsq / bsq).
export function buildPRTimeline({ sets = [], perf = [], sessionsOrder = [] }) {
  // Order by session sequence so PRs propagate forward correctly.
  // sessionsOrder is array of session_ids in chronological order.
  const sessionRank = new Map();
  sessionsOrder.forEach((id, i) => sessionRank.set(id, i));

  const orderedSets = [...sets].sort((a, b) =>
    (sessionRank.get(a.session_id) ?? 0) - (sessionRank.get(b.session_id) ?? 0)
  );
  const orderedPerf = [...perf].sort((a, b) =>
    (sessionRank.get(a.session_id) ?? 0) - (sessionRank.get(b.session_id) ?? 0)
  );

  // Track running best per lift / per exercise.
  const bestE1RM = {};       // liftKey -> { value, sessionId }
  const bestMeasure = {};    // exerciseKey -> { value, unit, sessionId }
  const e1rmPRs = {};
  const measurePRs = {};

  for (const s of orderedSets) {
    const liftKey = EX_TO_MAX_KEY[s.exercise_key];
    if (!liftKey) continue;
    const e1 = setE1RM(s);
    if (!e1) continue;
    const prev = bestE1RM[liftKey];
    if (!prev || e1 > prev.value) {
      bestE1RM[liftKey] = { value: e1, sessionId: s.session_id };
      (e1rmPRs[s.session_id] ??= []).push({
        liftKey,
        exerciseKey: s.exercise_key,
        exerciseName: s.exercise_name,
        value: Math.round(e1),
        previousBest: prev ? Math.round(prev.value) : null,
      });
    }
  }

  for (const p of orderedPerf) {
    const m = parseMeasurement(p.notes);
    if (!m) continue;
    const cond = metricFor(p.exercise_key);
    const higherIsBetter = cond?.higherIsBetter ?? true;
    const prev = bestMeasure[p.exercise_key];
    const improved = !prev || (higherIsBetter ? m.value > prev.value : m.value < prev.value);
    if (improved) {
      bestMeasure[p.exercise_key] = { value: m.value, unit: m.unit, sessionId: p.session_id, higherIsBetter };
      (measurePRs[p.session_id] ??= []).push({
        exerciseKey: p.exercise_key,
        exerciseName: p.exercise_name,
        value: m.value,
        unit: cond?.displayUnit ?? m.unit,
        previousBest: prev?.value ?? null,
        higherIsBetter,
      });
    }
  }

  return { e1rmPRs, measurePRs };
}

// Lightweight helper: given the prebuilt timeline + a session id, return a
// combined list of PRs for that session (e1RM + measurements together).
export function prsForSession(timeline, sessionId) {
  const out = [];
  for (const pr of (timeline.e1rmPRs[sessionId] ?? [])) {
    out.push({
      kind: 'e1rm',
      label: `${pr.exerciseName} 1RM`,
      value: `${pr.value} lbs`,
      delta: pr.previousBest != null ? `+${pr.value - pr.previousBest} lbs` : 'first PR',
    });
  }
  for (const pr of (timeline.measurePRs[sessionId] ?? [])) {
    // Delta string respects direction: improvements are positive, regressions
    // wouldn't make it here (only PRs do) but the sign reflects "got better".
    let deltaStr = 'first PR';
    if (pr.previousBest != null) {
      const raw = pr.higherIsBetter ? pr.value - pr.previousBest : pr.previousBest - pr.value;
      deltaStr = `+${Math.abs(raw).toFixed(1)} ${pr.unit}`;
    }
    out.push({
      kind: 'measure',
      label: pr.exerciseName,
      value: `${pr.value} ${pr.unit}`,
      delta: deltaStr,
    });
  }
  return out;
}
