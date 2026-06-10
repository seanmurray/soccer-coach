// Persist a finished session to Supabase.
//
// Writes (in order):
//   1. soccer_sessions  — the header row, returns the new id
//   2. soccer_sets       — each buffered strength/build set, FK = session id
//   3. soccer_exercise_perf — agility/plyo/cond feedback rows, FK = session id
//   4. soccer_module_usage — module open/close records, FK = session id
//
// Columns here are kept aligned with the live Supabase schema (verified
// 2026-05). Notes on schema vs spec drift:
//
//   - `soccer_sessions` does NOT have a top-level `phase` column. Phase
//     lives on `soccer_sets` / `soccer_exercise_perf` and is also stamped
//     into `soccer_sessions.metadata.phase` for the history screen.
//   - Free-form session telemetry (warmup completion, tabs visited) goes
//     into `soccer_sessions.metadata` (jsonb, added 2026-05).
//   - `performed_at` is a DATE on every soccer_* table, not a timestamp. We
//     send YYYY-MM-DD strings to avoid implicit-cast surprises.
//   - `opened_at` / `closed_at` on `soccer_module_usage` ARE timestamptz —
//     those keep the full ISO string.
//
// Also mirrors the day type to localStorage so the conditioning interference
// banner can read it on the next session (spec §14).
//
// Returns { ok, error, sessionId }.

import { supabase } from './supabase';
import { getPhase } from './periodization';

const LAST_DAY_KEY = 'last_session_day_type';

// LOCAL date, not UTC. toISOString() returns the UTC date, which silently
// rolls a 10pm CST session over to the next day. Use the local getters so
// "what day was this session?" matches the user's wall clock.
const toDateString = (input) => {
  const d = input ? new Date(input) : new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Defensive normalize: every persisted day_type must be one of these codes.
// Catches any future writer that hands in a display label like 'Acceleration'
// (we had three legacy rows from a pre-refactor path that did this — fixed
// in-place, but this guard stops it from coming back).
const DAY_CODES = ['acc', 'lat', 'lin', 'vel', 'cond'];
const LABEL_TO_CODE = {
  Acceleration: 'acc',
  'Lateral COD': 'lat',
  'Linear Agility': 'lin',
  'Max Velocity': 'vel',
  Conditioning: 'cond',
};
const normalizeDayType = (d) => {
  if (!d) return d;
  if (DAY_CODES.includes(d)) return d;
  const code = LABEL_TO_CODE[d] ?? d.toString().toLowerCase().slice(0, 3);
  return DAY_CODES.includes(code) ? code : d;
};

export async function saveSession({
  // Readiness inputs at session time
  rec, body, mot, battery, stress,
  mode, dayType, week,
  // Buffers
  setsBuffer = [],
  exercisePerfBuffer = [],
  moduleUsageBuffer = [],
  warmupChecked = [],
  warmupTotal = 0,
  frcShortChecked = [],
  frcShortTotal = 0,
  frcFullChecked = [],
  frcFullTotal = 0,
  tabsVisited = [],
  sessionStartedAt,
  sessionEndedAt,
  // Post-session inputs
  sessionRpe = 7.5,
  energy = 3,
  aiDebrief = null,
}) {
  if (!supabase) {
    return { ok: false, error: new Error('Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
  }

  const performedAt = toDateString(sessionStartedAt);
  const phase = getPhase(week);
  const dayTypeCode = normalizeDayType(dayType);

  const headerRow = {
    performed_at: performedAt,
    day_type: dayTypeCode,
    week_num: week,
    mode,
    recovery_pct: rec,
    // sleep_pct retired from the readiness model (2026-06) but the column is
    // kept so historical rows still display correctly. We just stop writing
    // to it — it will be null on all new sessions.
    body_feel: body,
    motivation: mot,
    battery_pct: battery,
    stress_score: stress,
    session_rpe: sessionRpe,
    energy,
    ai_debrief: aiDebrief,
    metadata: {
      phase,
      tabs_visited: tabsVisited,
      warmup_checked_count: warmupChecked.length,
      warmup_total: warmupTotal,
      frc_short_checked_count: frcShortChecked.length,
      frc_short_total: frcShortTotal,
      frc_short_checked: frcShortChecked,
      frc_full_checked_count: frcFullChecked.length,
      frc_full_total: frcFullTotal,
      frc_full_checked: frcFullChecked,
      sets_logged: setsBuffer.length,
      exercises_logged: exercisePerfBuffer.length,
      modules_used: moduleUsageBuffer.length,
      session_started_at: sessionStartedAt,
      // Real end-of-session time (Finish tapped). Preferred over created_at for
      // duration math — created_at also counts debrief-sheet time. Falls back
      // to now() if a caller didn't supply it.
      session_ended_at: sessionEndedAt ?? new Date().toISOString(),
    },
  };

  const { data: session, error: sessionError } = await supabase
    .from('soccer_sessions')
    .insert(headerRow)
    .select('id')
    .single();

  if (sessionError) return { ok: false, error: sessionError };
  const sessionId = session.id;

  // Sets — flatten, attach FK + performed_at, write in one batch.
  if (setsBuffer.length > 0) {
    const setsRows = setsBuffer.map((s) => ({
      session_id: sessionId,
      performed_at: toDateString(s.performed_at ?? performedAt),
      day_type: normalizeDayType(s.day_type ?? dayTypeCode),
      week_num: s.week_num ?? week,
      exercise_key: s.exercise_key,
      exercise_name: s.exercise_name,
      set_num: s.set_num,
      actual_reps: s.actual_reps,
      actual_weight: s.actual_weight,
      rpe: s.rpe,
      rec_weight: s.rec_weight,
      phase: s.phase ?? phase,
      mode: s.mode ?? mode,
    }));
    const { error } = await supabase.from('soccer_sets').insert(setsRows);
    if (error) return { ok: false, error };
  }

  // Exercise feedback (agility, plyo, cond).
  if (exercisePerfBuffer.length > 0) {
    const perfRows = exercisePerfBuffer.map((p) => ({
      session_id: sessionId,
      performed_at: toDateString(p.performed_at ?? performedAt),
      day_type: normalizeDayType(p.day_type ?? dayTypeCode),
      week_num: p.week_num ?? week,
      phase: p.phase ?? phase,
      mode: p.mode ?? mode,
      exercise_key: p.exercise_key,
      exercise_name: p.exercise_name,
      exercise_type: p.exercise_type,
      quality: p.quality,
      effort_rpe: p.effort_rpe,
      ease: p.ease,
      notes: p.notes,
    }));
    const { error } = await supabase.from('soccer_exercise_perf').insert(perfRows);
    if (error) return { ok: false, error };
  }

  // Module usage. opened_at/closed_at are timestamptz, performed_at is date.
  if (moduleUsageBuffer.length > 0) {
    const modRows = moduleUsageBuffer.map((m) => ({
      session_id: sessionId,
      performed_at: toDateString(m.opened_at ?? performedAt),
      module_id: m.module_id,
      module_label: m.module_label,
      opened_at: m.opened_at,
      closed_at: m.closed_at,
      duration_seconds: m.duration_seconds,
      exercises_done: m.exercises_done,
      exercises_total: m.exercises_total,
    }));
    const { error } = await supabase.from('soccer_module_usage').insert(modRows);
    if (error) return { ok: false, error };
  }

  // Mirror to localStorage for the conditioning interference banner.
  try { localStorage.setItem(LAST_DAY_KEY, dayTypeCode); } catch { /* ignore */ }

  return { ok: true, error: null, sessionId };
}
