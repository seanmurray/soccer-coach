// Swap → estimated 1RM ratio relative to the parent lift's working max.
//
// Used when a swap variant is active so we don't keep recommending the parent
// lift's weight (e.g. flat bench numbers while you're doing incline DBs).
// Once a swap has its own 3+ session history in soccer_sets we should
// override these ratios with a data-driven estimate — that's a follow-up.
//
// `pct: null` means we don't have a confident research-backed ratio for that
// variant; the UI will show "—" instead of pretending to know.
//
// Sources: Bromley, Helms, Rippetoe S&C; Israetel/RP educational material;
// OTA SPS notes. Numbers are common training-load ratios, not strict 1RM
// equivalents (DLs and BSQs are rarely 1RM-tested).

// `parentKey` is the strength exercise key in EX. Lookup is by swap label
// string (case-sensitive — these strings live verbatim in EX[*].swaps arrays).
export const SWAP_MAX_RATIOS = {
  bench_press: {
    'DB bench press (no barbell)': {
      pct: 0.80,
      reason: 'DB bench is typically ~80% of barbell max (total load — per hand ~40%).',
    },
    'Floor press (shoulder issue)': {
      pct: 0.90,
      reason: 'Floor press shortens ROM and kills the stretch reflex — ~90% of bench 1RM.',
    },
    'Larsen press (anterior shoulder sensitivity)': {
      pct: 0.82,
      reason: 'No leg drive — ~80-85% of standard bench 1RM.',
    },
    'Incline DB press (no flat bench)': {
      pct: 0.70,
      reason: 'Incline DB total load — ~70% of flat barbell bench (less mechanical advantage).',
    },
  },
  floor_press: {
    'Bench press (standard)': {
      pct: 1.10,
      reason: 'Full bench ROM + stretch reflex — typically ~10% heavier than floor press.',
    },
    'DB floor press (no barbell)': {
      pct: 0.85,
      reason: 'DB floor press total load — ~85% of barbell floor press.',
    },
  },
  trapbar_dl: {
    'Romanian deadlift (lower back — reduce ROM)': {
      pct: 0.70,
      reason: 'RDL is trained at 65-75% of DL — hamstring-focused, not maxed.',
    },
    'Hex bar high handle (knee issue)': {
      pct: 1.05,
      reason: 'Higher handles shorten ROM — usually 100-110% of standard trap bar.',
    },
    'BB rack pull from knee (upper back focus)': {
      pct: 1.18,
      reason: 'Top-half ROM only — typically 110-130% of full DL.',
    },
    'DB sumo deadlift (no barbell)': {
      pct: 0.65,
      reason: 'Limited by DB availability; set conservatively.',
    },
  },
  blg_split_sq: {
    'DB reverse lunge elevated (less stability demand)': {
      pct: 0.80,
      reason: 'Easier balance — usually 75-85% of BSQ load.',
    },
    'Step-ups (knee issue)': {
      pct: 0.80,
      reason: 'Step-ups: 70-90% of BSQ per-leg load.',
    },
    'Single-leg press (equipment sub)': {
      pct: 1.20,
      reason: 'Machine-supported — handles ~120% of free-weight BSQ.',
    },
    'Goblet squat (bilateral fallback)': {
      pct: null,
      reason: 'Bilateral load — not directly comparable; set by feel.',
    },
  },
  // Bulgarian and other accessories that get swapped don't have a single
  // 1RM reference, so they're intentionally omitted here.
};

// Look up the ratio for an active swap. Returns { pct, reason } or null.
export function ratioForSwap(parentExerciseKey, swapLabel) {
  if (!parentExerciseKey || !swapLabel) return null;
  return SWAP_MAX_RATIOS[parentExerciseKey]?.[swapLabel] ?? null;
}
