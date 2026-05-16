// Settings store — working maxes, day order, rest-timer prefs.
//
// Persisted to localStorage (and to Supabase by the legacy v9 — re-add when we
// wire that path). Reads at boot, writes on every change.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_DAY_ORDER } from '../data/sessions';

const initialMaxes = { trapbar: 0, bsq: 0, bench: 0, blgsq: 0 };

const initialTimerPrefs = {
  autoStart: true,
  audio: true,
  vibrate: true,
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      // Working maxes (lbs). Used by calcLoad in lib/periodization.
      maxes: initialMaxes,
      setMax: (key, lbs) => set((s) => ({ maxes: { ...s.maxes, [key]: lbs } })),
      setMaxes: (m) => set({ maxes: { ...initialMaxes, ...m } }),

      // Day order — Settings reorderable list, drives the Today day pills.
      dayOrder: DEFAULT_DAY_ORDER,
      setDayOrder: (order) => set({ dayOrder: order }),
      resetDayOrder: () => set({ dayOrder: [...DEFAULT_DAY_ORDER] }),

      // Season phase — scales strength volume (sets), intensity preserved.
      // 'off' | 'pre' | 'in' | 'playoff'. The program is authored for
      // pre-season; 'pre' is the no-op baseline.
      season: 'pre',
      setSeason: (season) => set({ season }),

      // Rest timer prefs
      timerPrefs: initialTimerPrefs,
      setTimerPref: (key, value) =>
        set((s) => ({ timerPrefs: { ...s.timerPrefs, [key]: value } })),
    }),
    {
      name: 'soccer-coach-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
