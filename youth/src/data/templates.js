// Day templates — ready-made sessions the athlete can pick from.
//
// Two contexts:
//   home — strictly bodyweight (+ a step/couch or a playground bar he can
//          improvise). No purchases needed. For days away from a gym.
//   gym  — adds dumbbells, a med ball, bands, a box.
//
// Every session is FULL BODY (right for a young beginner — no body-part
// splits) and follows the same athletic order: warm up → move fast/explosive
// while fresh (jumps, throws, sprints) → build strength → finish the core.
//
// Each block lists exercise keys from data/exercises.js. The session card
// shows each exercise's own video + cues + prescription.

export const TEMPLATES = [
  // ─── HOME (bodyweight) ──────────────────────────────────────
  {
    id: 'home_speed',
    name: 'Speed & Jumps',
    context: 'home',
    emphasis: 'Bodyweight · 25-30 min',
    blurb: 'No gear needed. Get fast and learn to jump and land like an athlete.',
    blocks: [
      { title: 'Warm-up', note: 'Get loose and warm', items: ['jumping_jacks', 'worlds_greatest', 'skip_a'] },
      { title: 'Jump & Land', note: 'Soft, quiet landings', items: ['stick_landing', 'pogo_hops', 'broad_jump'] },
      { title: 'Speed', note: 'Fast feet, full rest between', items: ['high_knees', 'accel_sprint', 'shuffle'] },
      { title: 'Strength', note: 'Control every rep', items: ['bodyweight_squat', 'split_squat'] },
      { title: 'Core finish', items: ['plank', 'dead_bug'] },
    ],
  },
  {
    id: 'home_strong',
    name: 'Strong Bodyweight',
    context: 'home',
    emphasis: 'Bodyweight · 25-30 min',
    blurb: 'Build full-body strength with just your bodyweight and a sturdy table or step.',
    blocks: [
      { title: 'Warm-up', note: 'Wake everything up', items: ['leg_swings', 'inchworm', 'bear_crawl'] },
      { title: 'Spring', note: 'Just a few, stay springy', items: ['stick_landing', 'pogo_hops'] },
      { title: 'Strength', note: 'Slow and strict', items: ['bodyweight_squat', 'incline_pushup', 'inverted_row', 'reverse_lunge'] },
      { title: 'Hips', items: ['glute_bridge'] },
      { title: 'Core finish', items: ['side_plank', 'hollow_hold'] },
    ],
  },

  // ─── GYM (equipment) ────────────────────────────────────────
  {
    id: 'gym_strong',
    name: 'Strong Day',
    context: 'gym',
    emphasis: 'Dumbbells, med ball · 35-40 min',
    blurb: 'Add a little weight to the big movements — squat, hinge, push, pull, carry.',
    blocks: [
      { title: 'Warm-up', note: 'Get loose and warm', items: ['jumping_jacks', 'worlds_greatest', 'leg_swings'] },
      { title: 'Power', note: 'Explode, then rest', items: ['mb_slam', 'mb_chest_pass'] },
      { title: 'Strength', note: 'Great form beats heavy weight', items: ['goblet_squat', 'db_rdl', 'db_press', 'db_row'] },
      { title: 'Carry & core', items: ['farmer_carry', 'plank'] },
    ],
  },
  {
    id: 'gym_power',
    name: 'Power Day',
    context: 'gym',
    emphasis: 'Box, med ball, bands · 35-40 min',
    blurb: 'Jump higher and throw harder, then build springy strength.',
    blocks: [
      { title: 'Warm-up', note: 'Get loose and warm', items: ['jumping_jacks', 'skip_a', 'arm_circles'] },
      { title: 'Jump & Throw', note: 'Max effort, full rest', items: ['box_jump', 'skater_bound', 'mb_rotational'] },
      { title: 'Strength', note: 'Build the spring', items: ['box_squat', 'band_good_morning', 'band_press', 'band_row'] },
      { title: 'Core finish', items: ['suitcase_carry', 'bird_dog'] },
    ],
  },
];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export const CONTEXTS = {
  home: { label: 'Home', emoji: '🏠', note: 'No equipment' },
  gym:  { label: 'Gym',  emoji: '🏋️', note: 'With equipment' },
};
