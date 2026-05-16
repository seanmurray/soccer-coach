// Body-region classification for the weekly upper/lower RPE averages.
//
// Only type:'strength' exercises ever write rows to soccer_sets (SetTable is
// used for strength + build-with-type-strength), so this map only needs to
// cover those keys. Each entry is annotated with the `muscle` field from
// src/data/exercises.js it was derived from — keep them in sync if a
// muscle value changes.
//
// 'core' = trunk / anti-rotation / rotational-power work. These are
// deliberately EXCLUDED from both the upper and lower averages: they're
// hip/torso-driven mixed-driver movements (the cues literally say "hip
// drives first"), so folding them into upper or lower would bias the
// fatigue signal. We'd rather under-count than mis-attribute. Any key not
// in this map is treated as 'other' and likewise excluded.

export const EXERCISE_REGION = {
  // ── UPPER (press / pull) ──
  bench_press:    'upper',  // muscle: 'push'
  floor_press:    'upper',  // muscle: 'push'
  pullup:         'upper',  // muscle: 'back pull'
  single_arm_row: 'upper',  // muscle: 'back unilateral'

  // ── LOWER (hinge / squat / unilateral leg) ──
  trapbar_dl:            'lower', // muscle: 'posterior chain'
  blg_split_sq:          'lower', // muscle: 'quad/glute unilateral'
  nordic_curl:           'lower', // muscle: 'hamstring eccentric'
  single_leg_hip_thrust: 'lower', // muscle: 'glute'
  goblet_lat_lunge:      'lower', // muscle: 'hip abductor'
  walking_lunge_db:      'lower', // muscle: 'unilateral lower body'

  // ── CORE / ROTATIONAL (excluded from upper & lower) ──
  pallof_press:             'core', // muscle: 'anti-rotation core'
  ab_wheel:                 'core', // muscle: 'anti-extension core'
  half_kneel_rot_chop:      'core', // muscle: 'rotational core'
  the_grappler:             'core', // muscle: 'rotational power'
  cable_row_rotation:       'core', // muscle: 'rotational pull'
  cable_press_rotation:     'core', // muscle: 'rotational push'
  walking_kb_high_pull_coil:'core', // muscle: 'full body rotational'
};

export function regionFor(exerciseKey) {
  return EXERCISE_REGION[exerciseKey] ?? 'other';
}

// Given soccer_sets rows ({ exercise_key, rpe }), return mean RPE for upper
// and lower regions (core/other excluded). Null when a region has no sets.
export function weeklyRegionRpe(sets = []) {
  const acc = { upper: [], lower: [] };
  for (const s of sets) {
    const r = regionFor(s.exercise_key);
    const rpe = Number(s.rpe);
    if ((r === 'upper' || r === 'lower') && Number.isFinite(rpe)) {
      acc[r].push(rpe);
    }
  }
  const mean = (arr) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
  return { avgUpperRpe: mean(acc.upper), avgLowerRpe: mean(acc.lower) };
}
