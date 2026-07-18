// Mesocycle exercise rotation + swap pools.
//
// Two rotation sources, one resolver (lib/periodization rotatedKey):
//   • Headline strength lifts rotate through a curated family of close cousins
//     (LIFT_ROTATIONS) — same movement, similar load.
//   • Build accessories rotate through their role POOL (BUILD_POOLS) — the pool
//     doubles as the manual swap menu.
//
// The active exercise for a slot in a given week = rotatedKey(home,
// variationsFor(home), week). See lib/periodization for the A-B-A-C pattern.

import { EX } from './exercises';

// ─── Headline-lift rotation families ───────────────────────────────────────
// home key → ordered variation keys. Variations carry maxKey + maxRatio in EX
// so their load resolves off the home lift's working max (bsq for the squat
// family, which is bilateral and gets its own Settings max).
export const LIFT_ROTATIONS = {
  bench_press:    ['close_grip_bench', 'wide_grip_bench'],
  blg_split_sq:   ['back_squat', 'ssb_squat'],
  overhead_press: ['push_press', 'seated_db_press'],
  trapbar_dl:     ['conventional_dl', 'deficit_trapbar'],
  pendlay_row:    ['chest_supported_row', 't_bar_row'],
};

// ─── Build accessory pools by role ─────────────────────────────────────────
// Ordered; the first entry is the sensible default when a day doesn't name one.
// A slot rotates through its role pool (its home rotates out to the others).
export const BUILD_POOLS = {
  push:          ['incline_db_press', 'dips', 'db_bench', 'floor_press'],
  pull:          ['chest_supported_row', 'pullup', 'single_arm_row', 't_bar_row', 'lat_pulldown', 'inverted_row', 'face_pull'],
  single_leg:    ['walking_lunge_db', 'reverse_lunge', 'step_up', 'split_squat_db'],
  lateral_lower: ['goblet_lat_lunge', 'lateral_lunge', 'cossack_squat', 'lateral_step_up', 'skater_squat'],
  adductor:      ['copenhagen_adduction', 'side_lying_adduction'],
  hamstring:     ['nordic_curl', 'sl_rdl', 'db_rdl'],
  glute:         ['single_leg_hip_thrust', 'barbell_hip_thrust', 'kb_swing'],
  rotational:    ['mb_rotational_slam', 'the_grappler', 'cable_row_rotation', 'cable_press_rotation', 'half_kneel_rot_chop', 'walking_kb_high_pull_coil', 'mb_slam', 'mb_scoop_toss'],
  anti_rotation: ['pallof_press', 'suitcase_carry', 'bird_dog'],
  anti_extension:['ab_wheel', 'dead_bug', 'hollow_hold', 'trx_fallout'],
};

// Reverse index: exercise key → role. Prefer the exercise's own `role` field;
// fall back to the first pool that lists it.
const KEY_ROLE = {};
for (const [role, keys] of Object.entries(BUILD_POOLS)) {
  for (const k of keys) if (!(k in KEY_ROLE)) KEY_ROLE[k] = role;
}
export function roleOf(key) {
  return EX[key]?.role ?? KEY_ROLE[key] ?? null;
}

// Variations a slot rotates through (excludes the home itself).
export function variationsFor(homeKey) {
  if (LIFT_ROTATIONS[homeKey]) return LIFT_ROTATIONS[homeKey];
  const role = roleOf(homeKey);
  if (!role || !BUILD_POOLS[role]) return [];
  return BUILD_POOLS[role].filter((k) => k !== homeKey);
}

// Full pick list for the manual swap menu (home first, then everything else in
// the family/pool). Headline → [home, ...variations]; accessory → whole pool
// with the home floated to the front.
export function poolFor(homeKey) {
  if (LIFT_ROTATIONS[homeKey]) return [homeKey, ...LIFT_ROTATIONS[homeKey]];
  const role = roleOf(homeKey);
  if (!role || !BUILD_POOLS[role]) return [homeKey];
  const pool = BUILD_POOLS[role];
  return [homeKey, ...pool.filter((k) => k !== homeKey)];
}

// ─── Build plan per day (supersedes SESSIONS[*][day].build) ────────────────
// Upper/lower accessory model (2026-07): the strength headline defines the
// day's region; the build reinforces it and covers the soccer non-negotiables.
//   • Upper days (acc=bench, lin=OHP) → push assist + pull + rotational + core.
//     No leg strength → the legs recover from the daily plyo/sprint work.
//   • Lower days (lat=BSS, vel=trap-bar) → the leg + injury-prevention work:
//     Copenhagen adduction (groin) on the cutting day, Nordic (hamstring) on
//     the velocity day, plus rotation on every day (soccer is rotational).
//
// Each list is PRIORITY ORDER (most valuable first). Reduced-readiness modes
// keep the first N slots (see MODE_BUILD_COUNT), so the highest-value work —
// the injury-prevention lifts and the pull/rotational balance — survives the
// deepest fatigue trims. Every slot is its own home for rotation + swap pool.
export const BUILD_PLAN = {
  // acc — Bench (upper). pull > rotational power > core > push-assist.
  acc: ['chest_supported_row', 'mb_rotational_slam', 'ab_wheel', 'incline_db_press'],
  // lat — BSS (lower / lateral). adductor injury-prev > frontal leg > anti-rot > rotational.
  lat: ['copenhagen_adduction', 'goblet_lat_lunge', 'pallof_press', 'the_grappler'],
  // lin — OHP (upper). pull > rotational > core > push-assist.
  lin: ['pullup', 'half_kneel_rot_chop', 'dead_bug', 'dips'],
  // vel — Trap-bar (lower / posterior). hamstring injury-prev > rotational > core > glute.
  vel: ['nordic_curl', 'walking_kb_high_pull_coil', 'hollow_hold', 'single_leg_hip_thrust'],
};

// How many build slots survive at each readiness mode (top-N of BUILD_PLAN).
export const MODE_BUILD_COUNT = {
  full: 4, mod1: 3, modified: 3, mod2: 2, mod3: 2, recovery: 1,
};

// The build homes for a given day + mode, in display/priority order.
export function buildHomesFor(dayType, mode) {
  const plan = BUILD_PLAN[dayType] ?? [];
  const n = MODE_BUILD_COUNT[mode] ?? plan.length;
  return plan.slice(0, n);
}
