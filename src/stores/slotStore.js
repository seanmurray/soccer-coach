// Manual exercise swaps layered over the automatic mesocycle rotation.
//
// Two scopes:
//   today — swap for THIS session only. In-memory; cleared on start/finish.
//   block — swap for the rest of the current 5-week block. Persisted, stamped
//           with the block index so it auto-expires when the block rolls over.
//
// A slot is keyed by its HOME exercise key. A choice is { key } (a pool
// exercise) or { custom: 'Name' } (an off-menu entry). resolveSlot() applies
// precedence today > block > rotation.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useSlotStore = create(
  persist(
    (set, get) => ({
      today: {},   // homeKey → choice   (session scope, not persisted)
      block: {},   // homeKey → { choice, block }   (persisted)

      // The two scopes are mutually exclusive per slot — choosing one clears
      // the other, so precedence stays unambiguous (today > block > rotation).

      // Swap for today only.
      swapToday: (homeKey, choice) =>
        set((s) => {
          const block = { ...s.block }; delete block[homeKey];
          return { today: { ...s.today, [homeKey]: choice }, block };
        }),

      // Swap for the rest of the current block (applies this session too, since
      // the stamped block matches the current one).
      swapBlock: (homeKey, choice, blockIdx) =>
        set((s) => {
          const today = { ...s.today }; delete today[homeKey];
          return { today, block: { ...s.block, [homeKey]: { choice, block: blockIdx } } };
        }),

      // Clear any manual choice for a slot (revert to rotation).
      clearSlot: (homeKey) =>
        set((s) => {
          const today = { ...s.today }; delete today[homeKey];
          const block = { ...s.block }; delete block[homeKey];
          return { today, block };
        }),

      // Called on session start/finish — drop today-scope swaps, keep block.
      clearToday: () => set({ today: {} }),

      getToday: (homeKey) => get().today[homeKey] ?? null,
      getBlock: (homeKey) => get().block[homeKey] ?? null,
    }),
    {
      name: 'soccer-coach-slots',
      storage: createJSONStorage(() => localStorage),
      // Only the block-scope overrides persist; today-scope is per-session.
      partialize: (s) => ({ block: s.block }),
    }
  )
);
