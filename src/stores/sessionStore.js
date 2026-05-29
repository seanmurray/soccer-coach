// Session store — readiness, derived mode, current-day selection, week, and
// in-flight workout buffers (sets, exercise perf, module usage).
//
// Stays in memory; persistence to Supabase happens on `Finish Session`. The
// only thing we mirror to localStorage is `last_session_day_type` for the
// conditioning-interference banner (spec §14).

import { create } from 'zustand';
import { computeMode } from '../lib/periodization';

const WEEK_KEY = 'soccer-coach-week';

function readPersistedWeek() {
  try {
    const v = Number(localStorage.getItem(WEEK_KEY));
    return Number.isFinite(v) && v >= 1 ? v : 1;
  } catch {
    return 1;
  }
}

const initialReadiness = {
  rec: 72,
  slp: 72,
  body: 3,    // 1-5
  mot: 3,     // 1-5
  battery: 50, // 0-100, Athlytic
  stress: 25,  // 0-60, Athlytic
};

export const useSessionStore = create((set, get) => ({
  // ── Readiness ──
  // Each value may be `null` to indicate "no data available" (e.g. didn't
  // wear the watch overnight). computeMode reweights based on present
  // inputs. _readinessLast caches the most recent non-null value for each
  // field so toggling exclude → include restores what the user last set.
  ...initialReadiness,
  _readinessLast: { ...initialReadiness },
  // Rolling personal baseline for battery/stress, pushed in from
  // useReadinessBaseline via <ReadinessBaselineSync>. null until it loads
  // (and on a fresh account) → computeMode uses absolute scoring.
  _readinessBaseline: null,
  mode: 'full',
  score: 0,

  setReadiness: (key, value) => {
    const patch = { [key]: value };
    if (value != null) {
      patch._readinessLast = { ...get()._readinessLast, [key]: value };
    }
    set(patch);
    const s = get();
    const { mode, score } = computeMode(s, s._readinessBaseline);
    set({ mode, score });
  },

  setReadinessBaseline: (baseline) => {
    set({ _readinessBaseline: baseline });
    const s = get();
    const { mode, score } = computeMode(s, baseline);
    set({ mode, score });
  },

  // Toggle whether a readiness input is excluded from the score. Excluding
  // sets the value to null; re-including restores the last non-null value
  // (or the initial default if there's never been one).
  toggleReadinessExclude: (key) => {
    const cur = get()[key];
    if (cur == null) {
      const last = get()._readinessLast[key] ?? initialReadiness[key];
      get().setReadiness(key, last);
    } else {
      get().setReadiness(key, null);
    }
  },

  // ── Day + week ──
  // The week pointer is persisted to localStorage (the rest of this store
  // stays in-memory by design). Before this it reset to 1 on every reload,
  // forcing a manual scroll to the right week each session. "Complete Week"
  // and the WeekBar arrows both write through setWeek.
  dayType: 'acc',     // 'acc' | 'lat' | 'lin' | 'vel' | 'cond'
  week: readPersistedWeek(),
  setDayType: (d) => set({ dayType: d }),
  setWeek: (w) => {
    const week = Math.max(1, w);
    set({ week });
    try { localStorage.setItem(WEEK_KEY, String(week)); } catch { /* ignore */ }
  },

  // ── In-flight workout buffers ──
  // Sets buffer: per-set strength/build records waiting to flush to Supabase.
  setsBuffer: [],
  exercisePerfBuffer: [],
  moduleUsageBuffer: [],
  warmupChecked: [],
  frcShortChecked: [],   // indices of FRC pre-session items checked
  frcFullChecked: [],    // indices of FRC post-conditioning items checked
  tabsVisited: [],
  sessionStartedAt: null,
  sessionEndedAt: null,

  startSession: () => set({
    setsBuffer: [],
    exercisePerfBuffer: [],
    moduleUsageBuffer: [],
    warmupChecked: [],
    frcShortChecked: [],
    frcFullChecked: [],
    tabsVisited: [],
    sessionStartedAt: new Date().toISOString(),
    sessionEndedAt: null,
  }),

  // Stamp the real end-of-session time when "Finish Session" is tapped — used
  // for accurate session duration (training load). Distinct from the row's
  // created_at, which is the save/insert time and includes debrief-sheet lag.
  markSessionEnd: () => set({ sessionEndedAt: new Date().toISOString() }),

  pushSet: (record) => set((s) => ({ setsBuffer: [...s.setsBuffer, record] })),
  pushExercisePerf: (record) => set((s) => ({ exercisePerfBuffer: [...s.exercisePerfBuffer, record] })),
  pushModuleUsage: (record) => set((s) => ({ moduleUsageBuffer: [...s.moduleUsageBuffer, record] })),

  setWarmupChecked: (idx, checked) => set((s) => {
    const next = new Set(s.warmupChecked);
    if (checked) next.add(idx); else next.delete(idx);
    return { warmupChecked: [...next] };
  }),

  setFrcChecked: (variant, idx, checked) => set((s) => {
    const field = variant === 'full' ? 'frcFullChecked' : 'frcShortChecked';
    const next = new Set(s[field]);
    if (checked) next.add(idx); else next.delete(idx);
    return { [field]: [...next] };
  }),

  logTabVisit: (tab) => set((s) =>
    s.tabsVisited.includes(tab) ? s : { tabsVisited: [...s.tabsVisited, tab] }
  ),

  resetSession: () => set({
    setsBuffer: [],
    exercisePerfBuffer: [],
    moduleUsageBuffer: [],
    warmupChecked: [],
    frcShortChecked: [],
    frcFullChecked: [],
    tabsVisited: [],
    sessionStartedAt: null,
    sessionEndedAt: null,
  }),
}));

// Initialize derived fields once at boot.
{
  const s = useSessionStore.getState();
  const { mode, score } = computeMode(s);
  useSessionStore.setState({ mode, score });
}
