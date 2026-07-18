// Resolve which exercise a workout slot actually runs, combining three layers
// of precedence:
//
//   1. today   — a manual swap for THIS session only (highest)
//   2. block   — a manual swap for the rest of the current 5-week block
//   3. rotation — the automatic A-B-A-C mesocycle rotation (fallback)
//
// A "slot" is identified by its HOME key (the day's programmed exercise). The
// resolved result tells the tab what to prescribe, load, log, and badge.

import { blockIndex, rotatedKey } from './periodization';
import { variationsFor } from '../data/rotation';
import { EX } from '../data/exercises';

// choice shape (from the slot store): { key: 'ex_key' } | { custom: 'Name' }
export function resolveSlot(homeKey, week, todayChoice = null, blockEntry = null) {
  const b = blockIndex(week);

  let choice = null;
  let source = null; // 'today' | 'block' | null (→ rotation)
  if (todayChoice) {
    choice = todayChoice;
    source = 'today';
  } else if (blockEntry && blockEntry.block === b && blockEntry.choice) {
    choice = blockEntry.choice;
    source = 'block';
  }

  // Manual custom entry — no EX record; log under a slug key.
  if (choice?.custom) {
    const name = choice.custom.trim();
    return {
      homeKey,
      activeKey: customKey(name),
      isCustom: true,
      isHome: false,
      source,               // 'today' | 'block'
      name,
      homeName: EX[homeKey]?.name ?? homeKey,
      block: b,
    };
  }

  // Manual pool pick, or automatic rotation.
  const activeKey = choice?.key ?? rotatedKey(homeKey, variationsFor(homeKey), week);
  const isHome = activeKey === homeKey;
  return {
    homeKey,
    activeKey,
    isCustom: false,
    isHome,
    // when no manual choice: 'rotation' (variation) or 'home'
    source: source ?? (isHome ? 'home' : 'rotation'),
    name: EX[activeKey]?.name ?? activeKey,
    homeName: EX[homeKey]?.name ?? homeKey,
    block: b,
  };
}

export function customKey(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return 'custom_' + (slug || 'lift');
}

// The saved exercise_name for a resolved slot. Real exercises log under their
// own name; a rotation/manual variation notes the home it stood in for; custom
// notes the same.
export function savedNameFor(res) {
  if (res.isHome) return res.name;
  if (res.isCustom) return `${res.name} (custom for: ${res.homeName})`;
  const tag = res.source === 'block' ? 'block swap' : res.source === 'today' ? 'swap' : 'rotation';
  return `${res.name} (${tag} for: ${res.homeName})`;
}

// Short badge label for the exercise header. null when it's the plain home lift
// running on schedule (no badge needed).
export function badgeFor(res) {
  if (res.isCustom) {
    return { text: `Custom${res.source === 'block' ? ' · rest of block' : ' · today'}`, tone: 'custom' };
  }
  if (res.source === 'today')  return { text: `Swapped today · home: ${res.homeName}`, tone: 'swap' };
  if (res.source === 'block')  return { text: `Swapped this block · home: ${res.homeName}`, tone: 'swap' };
  if (res.source === 'rotation') return { text: `Block ${res.block + 1} rotation · home: ${res.homeName}`, tone: 'rotation' };
  return null; // home on schedule
}
