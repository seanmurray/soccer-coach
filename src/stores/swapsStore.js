// Per-session active swap selections. Map of exercise_key → swap label.
//
// Spec §11: when a swap is active, the buffered set / exercise_perf row uses
// "SwapName (swap: OriginalName)" as the exercise_name, and the displayed
// video link points at a YouTube search for the swap name.
//
// Cleared on Start Session and Finish Session.

import { create } from 'zustand';

export const useSwapsStore = create((set, get) => ({
  active: {},
  // Set or unset the swap for a given exercise key. Pass `null` to clear.
  setSwap: (exerciseKey, swap) => {
    const cur = get().active;
    const next = { ...cur };
    if (swap == null) delete next[exerciseKey];
    else next[exerciseKey] = swap;
    set({ active: next });
  },
  getSwap: (exerciseKey) => get().active[exerciseKey] ?? null,
  clear: () => set({ active: {} }),
}));

// Helper: derive the effective display name / url / saved name for an
// exercise, given an optional active swap.
export function applySwap(ex, swap) {
  if (!swap) {
    return { displayName: ex.name, url: ex.url, savedName: ex.name };
  }
  return {
    displayName: swap,
    url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(swap),
    savedName: `${swap} (swap: ${ex.name})`,
  };
}
