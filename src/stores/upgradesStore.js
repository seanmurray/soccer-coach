// Active upgrade-variant selections, per exercise key, for the current
// session. Binary: an exercise either uses its standard form or its upgrade.
//
// When an upgrade is active, the displayed exercise name + video URL switch
// to the upgrade variant, and the buffered set / feedback row is logged with
// "(upgrade)" baked into its name + an upgrade=true note.
//
// Cleared on Start Session and Finish Session — same lifecycle as swaps.

import { create } from 'zustand';

export const useUpgradesStore = create((set, get) => ({
  active: {},  // { [exerciseKey]: true }
  toggle: (exerciseKey) => {
    const next = { ...get().active };
    if (next[exerciseKey]) delete next[exerciseKey];
    else next[exerciseKey] = true;
    set({ active: next });
  },
  isActive: (exerciseKey) => !!get().active[exerciseKey],
  clear: () => set({ active: {} }),
}));

// Compose with applySwap(): if an upgrade is active, swap is ignored.
// Spec §11 treats version (original/upgrade) and swap (alternate exercise)
// as mutually exclusive paths on the same exercise slot.
export function applyUpgrade(ex, upgradeActive) {
  if (!upgradeActive || !ex.upgrade) {
    return { displayName: ex.name, url: ex.url, savedName: ex.name, isUpgrade: false };
  }
  return {
    displayName: ex.upgrade.name,
    url: ex.upgrade.url,
    savedName: `${ex.upgrade.name} (upgrade: ${ex.name})`,
    isUpgrade: true,
  };
}
