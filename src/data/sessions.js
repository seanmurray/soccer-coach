// Session programs — extracted verbatim from soccer_performance_coach_v9.html.
//
// Shape: SESSIONS[mode][dayType] = { agility, plyo, strength, build } for
// non-cond days, or { protocols } for cond days. Modes are the 5-tier readiness
// system: full, mod1, mod2, mod3, recovery (plus a legacy `modified` block from
// v9 that still sits behind some prescription paths).
//
// Exercise keys here MUST exist in src/data/exercises.js EX dict — except for
// the v9 leftover `cable_woodchop` referenced under mod3.lat.build, which is
// missing from EX. Treat that as a known data bug to resolve in the next pass.
//
// ─── HEART-RATE PRESCRIPTIONS ──────────────────────────────────────────────
// Conditioning HR targets below are absolute bpm, not %HRmax, computed for
// this athlete (age 44). HRmax basis:
//   Tanaka 2001   208 − 0.7·age  = 177  (most-validated population formula)
//   Nes 2013      211 − 0.64·age = 183  (HUNT cohort; better for trained adults)
//   Fox/Haskell   220 − age      = 176  (underestimates trained masters; not used)
// Athlete reports ~180 bpm is a hard-but-submaximal effort, so true HRmax is
// at least ~183. Working HRmax = 185 bpm (just above Nes, consistent with the
// submaximal-180 data point). Adjust WORKING_HRMAX if a true max is ever tested.
//
// Zone table (×185, rounded to nearest 5 for prose):
//   60% ≈110  65% ≈120  70% ≈130  75% ≈140  80% ≈150
//   85% ≈157  90% ≈167  95% ≈176  100% =185
export const WORKING_HRMAX = 185;

export const SESSIONS = {
  full: {
    acc: {
      agility: ['falling_starts', 'wall_starts', 'two_pt_starts', 'half_kneel_starts', 'decel_series'],
      plyo: ['snap_downs', 'broad_jump', 'half_kneel_box_jump', 'sprinter_step_up'],
      strength: ['bench_press'],
      build: ['walking_lunge_db', 'the_grappler', 'pullup', 'ab_wheel'],
    },
    lat: {
      agility: ['lat_power_shuffle', 'carioca_qstep', 'half_arc_run', 'lat_shuffle_react', 'y_cut', 'jump_cut'],
      plyo: ['v_jumps', 'skater_jumps', 'ascending_skaters', 'russian_lunge', 'russian_speed_lunge'],
      strength: ['blg_split_sq'],
      build: ['walking_lunge_db', 'nordic_curl', 'the_grappler', 'half_kneel_rot_chop'],
    },
    lin: {
      agility: ['two_pt_stop_go', 'pro_shuttle', 'l_drill', 'lat_power_shuffle', 'figure_8_drill'],
      plyo: ['lateral_bounds', 'sl_snap_down', 'blg_squat_jump', 'russian_lunge'],
      strength: ['bench_press'],
      build: ['walking_lunge_db', 'cable_row_rotation', 'pullup', 'pallof_press'],
    },
    vel: {
      agility: ['high_knee_run', 'butt_kick_run', 'a_skips', 'b_skips', 'sl_high_knee', 'sl_cycling', 'str_leg_bounds', 'alternating_bounds', 'step_over_runs', 'build_ups'],
      plyo: ['sl_broad_jump', 'sl_triple_jump', 'box_jump'],
      strength: ['trapbar_dl'],
      build: ['blg_split_sq', 'walking_lunge_db', 'the_grappler', 'cable_press_rotation'],
    },
    cond: {
      // Soccer-specific conditioning — protocols adapted to user's equipment
      // (no soccer field). Sources: Bangsbo speed-endurance research, Buchheit
      // 30-15 IFT, HIIT Science RSA literature.
      //
      // recommendedModes: which readiness tiers this protocol is appropriate for.
      // Rationale: three dimensions gate each protocol —
      //   (1) CNS cost: near-max sprint mechanics on a fatigued CNS produce
      //       compensated movement, not adaptation, and raise injury risk.
      //   (2) Running load: running creates greater strength/conditioning
      //       interference than cycling, rowing, or SkiErg; biased out at mod2+.
      //   (3) Test vs training: the 30-15 IFT is a benchmark; a fatigued result
      //       is invalid data. Full-readiness only.
      protocols: [
        {
          exercise_key: 'norwegian_4x4',
          name: 'Norwegian 4×4',
          desc: '4 rounds: 4 min @ 157-176 bpm / 3 min recovery. Gold-standard VO2max protocol — the engine upgrade that lets you sustain second-half output. Treadmill works fine. Same speed all 4 intervals — if rep 4 felt easier than rep 1, push harder next time.',
          rpe: 9, tags: ['cond'], kind: 'norwegian_4x4',
          hr_low: 157, hr_high: 176, // 85-95% HRmax — Z4/Z5
          recommendedModes: ['full', 'mod1'],
          notRecommendedReason: 'Running-based conditioning increases strength interference at reduced readiness. Prefer bike, rower, or SkiErg today.',
        },
        {
          exercise_key: 'bangsbo_speed_endurance',
          name: 'Bangsbo Speed Endurance (Production)',
          desc: '6 rounds: 30 sec near-max sprint / 2:30 walk. Bangsbo "production" protocol — builds the anaerobic capacity to repeat hard efforts late in matches. Curved treadmill is ideal; motorized works at 90% of your true sprint speed.',
          rpe: 9, tags: ['cond'], kind: 'single_metric',
          recommendedModes: ['full'],
          notRecommendedReason: 'Near-max sprint efforts on a fatigued CNS produce compensated mechanics, not adaptation. Injury risk rises without corresponding benefit.',
        },
        {
          exercise_key: 'thirty_fifteen_ift',
          name: '30-15 Intermittent Fitness Test',
          desc: 'Buchheit 30-15 IFT. 30 sec running / 15 sec walk, treadmill speed increases each stage. Top sustainable stage speed (VIFT) is the soccer-specific aerobic-anaerobic benchmark — used by elite clubs to prescribe HIIT load. Run until you can\'t hold the stage speed for the full 30s.',
          rpe: 10, tags: ['cond'], kind: 'single_metric',
          recommendedModes: ['full'],
          notRecommendedReason: 'Benchmark test — a fatigued result is invalid data and won\'t reflect true fitness. A low score today is noise, not signal. Run it fresh.',
        },
        {
          exercise_key: 'treadmill_rsa',
          name: 'Treadmill RSA Intervals',
          desc: '10 rounds: 30 sec sprint / 30 sec walk (1:1 work:rest). Repeat-sprint ability — the single most-trained quality for soccer. Short recovery forces lactate clearance. Same speed all 10 reps.',
          rpe: 9, tags: ['cond', 'acc'], kind: 'single_metric',
          recommendedModes: ['full', 'mod1'],
          notRecommendedReason: 'Running-based RSA at this readiness level risks compensated sprint patterns and adds musculoskeletal load your recovery can\'t absorb. Prefer non-running conditioning today.',
        },
        {
          exercise_key: 'curved_tm_sprint',
          name: 'Curved treadmill sprint intervals',
          desc: '6 rounds: 30 sec sprint / 90 sec walk. Self-propelled — your legs drive it. Closer to overground sprint mechanics than motorized treadmill.',
          rpe: 8, tags: ['cond', 'acc'], kind: 'single_metric',
          recommendedModes: ['full', 'mod1'],
          notRecommendedReason: 'Running-based conditioning at moderate-to-high fatigue creates more stress than adaptation. Bike or rower provides equivalent metabolic load at lower tissue cost.',
        },
        {
          exercise_key: 'court_sprint_repeats',
          name: 'Court repeat sprints',
          desc: '10 rounds: full court sprint / walk back. Closest you\'ll get to actual match RSA without a pitch. Average sprint time should stay within 5% of your first rep — bigger drop-off = the deconditioning you\'re here to fix.',
          rpe: 9, tags: ['cond', 'acc'], kind: 'single_metric',
          recommendedModes: ['full'],
          notRecommendedReason: 'High-impact RSA on fatigued legs compounds musculoskeletal stress. Sprint quality degrades faster than the aerobic benefit justifies — you\'ll just be training compensations.',
        },
        {
          exercise_key: 'skierg_1on2off',
          name: 'SkiErg — 1 min on / 2 min off',
          desc: '5 rounds at 85-90% max effort. Recruits upper body + posterior chain — useful counterweight to lower-body-dominant soccer load. Log the average 500m split.',
          rpe: 8, tags: ['cond'], kind: 'single_metric',
          recommendedModes: ['full', 'mod1', 'mod2'],
          notRecommendedReason: 'Interval-intensity work exceeds your recovery capacity at this readiness level. Zone 2 only today.',
        },
        {
          exercise_key: 'rower_500m_repeats',
          name: 'Rower — 500m repeats',
          desc: '4×500m, rest = work time × 1.5. Consistent splits — not faster first, dying last. Best balance of metabolic stress and joint friendliness.',
          rpe: 8, tags: ['cond'], kind: 'single_metric',
          recommendedModes: ['full', 'mod1', 'mod2'],
          notRecommendedReason: 'Interval-intensity work exceeds your recovery capacity at this readiness level. Zone 2 only today.',
        },
        {
          exercise_key: 'assault_bike_tabata',
          name: 'Assault bike — tabata',
          desc: '8 rounds: 20 sec all-out / 10 sec rest. 90-100% max output each interval. Highest anaerobic stress per minute of any protocol — use sparingly.',
          rpe: 9, tags: ['cond'], kind: 'single_metric',
          recommendedModes: ['full', 'mod1', 'mod2'],
          notRecommendedReason: 'Maximum anaerobic output is contraindicated at this readiness level. If you want to use the bike today, keep it Zone 2.',
        },
        {
          exercise_key: 'bike_court_combo',
          name: 'Bike + court sprint combo',
          desc: '4 rounds: 30s bike sprint + immediately 1 full court sprint. Pre-fatigues the legs before the sprint — trains the late-match scenario where you have to find another gear with tired legs. Log total elapsed time.',
          rpe: 9, tags: ['cond', 'acc'], kind: 'single_metric',
          recommendedModes: ['full'],
          notRecommendedReason: 'Pre-fatigued sprinting compounds stress on already-stressed tissue. This protocol requires a fresh neuromuscular system to produce adaptation rather than breakdown.',
        },
        {
          exercise_key: 'treadmill_zone2',
          name: 'Treadmill Zone 2 steady',
          desc: '20-30 min @ 140-150 bpm. Aerobic base — improves recovery capacity between sprints and total session volume tolerance. Nasal-breathing pace if possible.',
          rpe: 5, tags: ['cond'], kind: 'single_metric',
          hr_low: 140, hr_high: 150, // ~75-80% HRmax — top of Z3 / bottom of Z4
          recommendedModes: ['full', 'mod1', 'mod2', 'mod3', 'recovery'],
        },
      ],
    },
  },

  // Legacy v9 'modified' block — still referenced by getStrengthPrescription
  // for prescription mapping. Selection lists below match v9 exactly.
  modified: {
    acc: { agility: ['two_pt_starts', 'half_kneel_starts', 'decel_series'], plyo: ['snap_downs', 'seated_box_jump'], strength: ['bench_press'], build: ['walking_lunge_db', 'the_grappler', 'ab_wheel'] },
    lat: { agility: ['lat_power_shuffle', 'half_arc_run', 'y_cut'], plyo: ['skater_jumps', 'v_jumps'], strength: ['blg_split_sq'], build: ['walking_lunge_db', 'nordic_curl', 'the_grappler'] },
    lin: { agility: ['pro_shuttle', 'figure_8_drill', 'lat_power_shuffle'], plyo: ['lateral_bounds'], strength: ['bench_press'], build: ['walking_lunge_db', 'cable_row_rotation', 'pallof_press'] },
    vel: { agility: ['a_skips', 'b_skips', 'alternating_bounds', 'build_ups'], plyo: ['sl_broad_jump', 'box_jump'], strength: ['trapbar_dl'], build: ['blg_split_sq', 'single_leg_hip_thrust'] },
    cond: { protocols: [{ name: 'Easy bike or court jog', desc: '20 min at RPE 5-6 — aerobic flush. HR ~120-140 bpm.', rpe: 5, tags: ['cond'], hr_low: 120, hr_high: 140 }] },
  },

  // mod1: minor fatigue — same exercise selection as full, trim 1 set from
  // strength, skip last plyo. Strength prescription handled at -15%.
  mod1: {
    acc: {
      agility: ['falling_starts', 'two_pt_starts', 'half_kneel_starts', 'decel_series'],
      plyo: ['snap_downs', 'broad_jump', 'sprinter_step_up'],
      strength: ['bench_press'],
      build: ['walking_lunge_db', 'the_grappler', 'pullup'],
    },
    lat: {
      agility: ['lat_power_shuffle', 'carioca_qstep', 'half_arc_run', 'y_cut', 'jump_cut'],
      plyo: ['v_jumps', 'skater_jumps', 'russian_lunge'],
      strength: ['blg_split_sq'],
      build: ['walking_lunge_db', 'nordic_curl', 'the_grappler'],
    },
    lin: {
      agility: ['two_pt_stop_go', 'pro_shuttle', 'l_drill', 'figure_8_drill'],
      plyo: ['lateral_bounds', 'sl_snap_down', 'russian_lunge'],
      strength: ['bench_press'],
      build: ['walking_lunge_db', 'cable_row_rotation', 'pallof_press'],
    },
    vel: {
      agility: ['a_skips', 'b_skips', 'sl_high_knee', 'str_leg_bounds', 'alternating_bounds', 'build_ups'],
      plyo: ['sl_broad_jump', 'box_jump'],
      strength: ['trapbar_dl'],
      build: ['blg_split_sq', 'walking_lunge_db', 'the_grappler'],
    },
    cond: {
      protocols: [
        {
          exercise_key: 'norwegian_4x4',
          name: 'Norwegian 4×4 (capped intent)',
          desc: '4 rounds: 4 min @ 148-157 bpm / 3 min recovery. Same protocol as full, but cap intent at RPE 7.5. Still effective VO2max work, less CNS cost.',
          rpe: 7.5, tags: ['cond'], kind: 'norwegian_4x4',
          hr_low: 148, hr_high: 157, // 80-85% HRmax — Z4 capped
        },
        {
          exercise_key: 'assault_bike_tabata',
          name: 'Assault bike — aerobic intervals',
          desc: '6 rounds: 30 sec moderate / 90 sec easy. RPE 6-7 — not all-out. Aerobic development without high CNS cost.',
          rpe: 6, tags: ['cond'], kind: 'single_metric',
        },
        {
          exercise_key: 'rower_500m_repeats',
          name: 'Rower — steady state',
          desc: '15-20 min at RPE 6. Consistent pace, nasal breathing if possible. Log your average 500m split.',
          rpe: 6, tags: ['cond'], kind: 'single_metric',
        },
        {
          exercise_key: 'treadmill_zone2_easy',
          name: 'Treadmill easy jog',
          desc: '15-20 min light jog at RPE 5. Movement prep / aerobic flush, not real conditioning. Log your average mph.',
          rpe: 5, tags: ['cond'], kind: 'single_metric',
        },
      ],
    },
  },

  // mod2: moderate fatigue — core exercises only, cap RPE 7.5, skip high-CNS plyos.
  mod2: {
    acc: { agility: ['two_pt_starts', 'wall_starts', 'decel_series'], plyo: ['snap_downs', 'seated_box_jump'], strength: ['bench_press'], build: ['walking_lunge_db', 'the_grappler'] },
    lat: { agility: ['lat_power_shuffle', 'half_arc_run', 'y_cut'], plyo: ['skater_jumps'], strength: ['blg_split_sq'], build: ['walking_lunge_db', 'nordic_curl'] },
    lin: { agility: ['pro_shuttle', 'figure_8_drill'], plyo: ['lateral_bounds'], strength: ['bench_press'], build: ['walking_lunge_db', 'cable_row_rotation'] },
    vel: { agility: ['a_skips', 'b_skips', 'build_ups'], plyo: ['box_jump'], strength: ['trapbar_dl'], build: ['blg_split_sq', 'walking_lunge_db'] },
    cond: {
      protocols: [
        { exercise_key: 'assault_bike_tabata', name: 'Assault bike — Zone 2', desc: '20 min at RPE 5-6. Conversational pace. HR ~120-140 bpm. Aerobic flush — supports recovery, not a training stimulus.', rpe: 5, tags: ['cond'], kind: 'single_metric', hr_low: 120, hr_high: 140 },
        { exercise_key: 'skierg_1on2off', name: 'SkiErg — easy steady state', desc: '15 min easy. Breathing should be controlled throughout.', rpe: 5, tags: ['cond'], kind: 'single_metric' },
      ],
    },
  },

  // mod3: high fatigue — technique maintenance only, 55% load, bodyweight plyos.
  mod3: {
    acc: { agility: ['a_skips', 'b_skips', 'wall_starts'], plyo: ['pogo_jumps', 'snap_downs'], strength: ['bench_press'], build: ['walking_lunge_db', 'half_kneel_rot_chop'] },
    // v9 referenced `cable_woodchop` here, which never existed in EX.
    // Substituting `half_kneel_rot_chop` — same movement family (cable rotation
    // chop) and an appropriate fit for mod3's "technique only" prescription.
    lat: { agility: ['lat_power_shuffle'], plyo: ['pogo_jumps', 'skater_jumps'], strength: ['blg_split_sq'], build: ['walking_lunge_db', 'half_kneel_rot_chop'] },
    lin: { agility: ['a_skips', 'b_skips'], plyo: ['pogo_jumps'], strength: ['bench_press'], build: ['walking_lunge_db', 'pallof_press'] },
    vel: { agility: ['a_skips', 'b_skips', 'high_knee_run'], plyo: ['pogo_jumps'], strength: ['trapbar_dl'], build: ['walking_lunge_db', 'single_leg_hip_thrust'] },
    cond: {
      protocols: [
        { exercise_key: 'treadmill_zone2', name: 'Treadmill Zone 2 — active recovery', desc: '15-20 min very easy jog or walk. RPE 3-4. Movement, not conditioning. Keep HR under ~115 bpm.', rpe: 3, tags: ['cond'], kind: 'single_metric', hr_low: null, hr_high: 115 },
      ],
    },
  },

  recovery: {
    acc: { agility: ['a_skips', 'b_skips'], plyo: ['pogo_jumps'], strength: ['bench_press'], build: ['half_kneel_rot_chop'] },
    lat: { agility: [], plyo: ['pogo_jumps', 'skater_jumps'], strength: ['blg_split_sq'], build: ['the_grappler'] },
    lin: { agility: [], plyo: [], strength: ['bench_press'], build: ['walking_lunge_db', 'cable_row_rotation', 'pallof_press'] },
    vel: { agility: ['a_skips', 'b_skips'], plyo: ['pogo_jumps'], strength: ['trapbar_dl'], build: ['single_leg_hip_thrust'] },
    cond: { protocols: [{ exercise_key: 'treadmill_zone2', name: 'Treadmill Zone 2 — recovery flush', desc: '15-20 min light jog or walk. HR under ~110 bpm. Circulation only — no training stimulus intended.', rpe: 4, tags: ['cond'], kind: 'single_metric', hr_low: null, hr_high: 110 }] },
  },
};

// Per-mode, per-day coaching narrative — shown above the workout block.
export const MODE_INSIGHTS = {
  full: {
    acc:  'CNS is fully primed. Lead with falling starts at maximum intent before any fatigue accumulates. Plyos next, strength last with full tempo prescription. This is your day to chase adaptation — do not hold back on the agility block.',
    lat:  'Full lateral COD block. All 5 agility drills. Bulgarian split squats with complete eccentric control and iso pause per phase prescription. Rotational build work after — hip-leads-shoulder sequencing.',
    lin:  'Linear agility quality over quantity. Pro shuttle and L-drill are CNS-expensive — full 90-120 sec recovery between reps. Strength at full prescription.',
    vel:  'Max velocity is skill work. Stay technical through all build-ups. Trap bar contrast method: heavy set immediately followed by max box jump. The heavy load potentiates CNS for the explosive movement.',
    cond: 'Full conditioning capacity. Push hard on work intervals — RPE 8-9 during effort, genuine rest between. Research: court sprints create the highest interference with strength; if session follows a heavy strength day, bias toward bike instead.',
  },
  mod1: {
    acc:  'Minor fatigue — trim 1 exercise from agility, not intensity. First 3 drills stay at full effort. Cap acceleration volume at 85% of planned. Strength at –15% load, same sets.',
    lat:  'Lateral work at 90% effort. Cut last agility drill. BSQ stays — reduce by 1 set if needed, keep eccentric quality. SBS research: skill-based performance (agility, reaction) is more sleep/fatigue sensitive than raw strength.',
    lin:  'Trim to 4 agility exercises. Full effort on each rep, fewer total reps. Strength at –15%, technique priority.',
    vel:  'All velocity mechanics work stays — mechanics do not degrade with minor fatigue. Build-ups at 90% max. Strength –15%.',
    cond: 'Aerobic intervals at RPE 6-7, not all-out. 6 rounds instead of 8. Avoid running-based conditioning today — SBS research: running creates greater strength interference than cycling. Prefer bike or rower.',
  },
  mod2: {
    acc:  'Moderate fatigue. Two agility drills only — choose highest skill demand. Snap downs and seated box jump only — no max-effort plyos. Strength at –25%, cap RPE 7.5. No surprise if today feels heavy.',
    lat:  'Core lateral work only — shuffle and one cutting drill. One plyo. BSQ at –25% — maintain tempo and form but do not push into high RPE territory. McGill: do not load a system already under stress.',
    lin:  'Two agility drills. One plyo set. Strength at –25%. Use today to practice mechanics, not chase load.',
    vel:  'A/B skips and build-ups only — mechanics work. Box jump stays as single plyo (sub-max effort). Trap bar at –25%.',
    cond: 'Zone 2 aerobic work only. 20 min max. HR ~120-140 bpm. This is an aerobic flush — supports recovery rather than creating new training stress. No sprint intervals at this readiness level.',
  },
  mod3: {
    acc:  'High fatigue — tissue stress elevated. Mechanics work only: A/B skips, wall starts. Pogo jumps for lower leg stiffness — low CNS cost. Strength at 55%: motor pattern maintenance, not training stimulus. McGill: loading a fatigued system creates injury risk without corresponding adaptation.',
    lat:  'Pogo jumps and light skaters — no max landing demand. Shuffle only. BSQ at 55% — 3 sets, technique focus. Single rotation build exercise.',
    lin:  'Mechanics skips only. Pogo jumps. Bench at 55%. Your job today is to show up and move — not to train.',
    vel:  'High knee run and A/B skips. Pogo jumps. Trap bar at 55% — hip hinge pattern maintenance only. SBS data: strength maintenance requires only ~30-40% of the volume needed to build it.',
    cond: 'Active recovery movement only. Easy bike at RPE 3-4 or a walk. The goal is circulation and tissue recovery, not a training effect. Keep HR under ~115 bpm.',
  },
  recovery: {
    acc:  'Active recovery. Light skip work for mechanics, very light lifting. 30 min max. Nothing that creates new DOMS.',
    lat:  'Pogo jumps and bodyweight skaters at low intensity. Hip mobility module strongly recommended today.',
    lin:  'Skip agility. Light rotation work and core. Back prehab module ideal.',
    vel:  'A/B skips for mechanics — not speed. Light trap bar for hip hinge pattern only.',
    cond: 'Easy bike Zone 2 only. 15 min. No intervals, no sprints — keep HR under ~110 bpm.',
  },
};

// Day-type metadata: subtitle copy + tag color key (matches CSS .tag-* classes).
export const DAY_TYPE_INFO = {
  acc:  { sub: 'Acceleration',    color: 'acc' },
  lat:  { sub: 'Lateral COD',     color: 'lat' },
  lin:  { sub: 'Linear Agility',  color: 'lin' },
  vel:  { sub: 'Max Velocity',    color: 'vel' },
  cond: { sub: 'Conditioning',    color: 'cond' },
};

// Default day order — Settings screen lets the user reorder.
export const DEFAULT_DAY_ORDER = ['acc', 'lat', 'lin', 'vel', 'cond'];

// Mode → label/sub mapping for the Today-screen banner.
export const MODE_DATA = {
  full:     { label: 'Full Training',     sub: 'All blocks · Full volume · Full intent', emoji: '⚡' },
  mod1:     { label: 'Modified — Light',  sub: 'Strength −15% · Plyo −1 set',             emoji: '◐' },
  mod2:     { label: 'Modified — Medium', sub: 'Strength −25% · Plyo −30% · Cap RPE 7.5', emoji: '◑' },
  mod3:     { label: 'Modified — Heavy',  sub: '55% load · Motor pattern only',           emoji: '◒' },
  recovery: { label: 'Recovery Day',      sub: 'Active recovery only',                    emoji: '☾' },
};
