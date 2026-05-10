// Session store — readiness, derived mode, current-day selection, week, and
// in-flight workout buffers (sets, exercise perf, module usage).
//
// Stays in memory; persistence to Supabase happens on `Finish Session`. The
// only thing we mirror to localStorage is `last_session_day_type` for the
// conditioning-interference banner (spec §14).

import { create } from 'zustand';
import { computeMode } from '../lib/periodization';

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
  ...initialReadiness,
  mode: 'full',
  score: 0,

  setReadiness: (key, value) => {
    set({ [key]: value });
    const s = get();
    const { mode, score } = computeMode(s);
    set({ mode, score });
  },

  // ── Day + week ──
  dayType: 'acc',     // 'acc' | 'lat' | 'lin' | 'vel' | 'cond'
  week: 1,
  setDayType: (d) => set({ dayType: d }),
  setWeek: (w) => set({ week: Math.max(1, w) }),

  // ── In-flight workout buffers ──
  // Sets buffer: per-set strength/build records waiting to flush to Supabase.
  setsBuffer: [],
  exercisePerfBuffer: [],
  moduleUsageBuffer: [],
  warmupChecked: [],
  tabsVisited: [],
  sessionStartedAt: null,

  startSession: () => set({
    setsBuffer: [],
    exercisePerfBuffer: [],
    moduleUsageBuffer: [],
    warmupChecked: [],
    tabsVisited: [],
    sessionStartedAt: new Date().toISOString(),
  }),

  pushSet: (record) => set((s) => ({ setsBuffer: [...s.setsBuffer, record] })),
  pushExercisePerf: (record) => set((s) => ({ exercisePerfBuffer: [...s.exercisePerfBuffer, record] })),
  pushModuleUsage: (record) => set((s) => ({ moduleUsageBuffer: [...s.moduleUsageBuffer, record] })),

  setWarmupChecked: (idx, checked) => set((s) => {
    const next = new Set(s.warmupChecked);
    if (checked) next.add(idx); else next.delete(idx);
    return { warmupChecked: [...next] };
  }),

  logTabVisit: (tab) => set((s) =>
    s.tabsVisited.includes(tab) ? s : { tabsVisited: [...s.tabsVisited, tab] }
  ),

  resetSession: () => set({
    setsBuffer: [],
    exercisePerfBuffer: [],
    moduleUsageBuffer: [],
    warmupChecked: [],
    tabsVisited: [],
    sessionStartedAt: null,
  }),
}));

// Initialize derived fields once at boot.
{
  const s = useSessionStore.getState();
  const { mode, score } = computeMode(s);
  useSessionStore.setState({ mode, score });
}
