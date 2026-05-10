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
      protocols: [
        { name: 'Assault bike — tabata', desc: '8 rounds: 20 sec all-out / 10 sec rest. 90-100% max output each interval.', rpe: 9, tags: ['cond'] },
        { name: 'Curved treadmill sprint intervals', desc: '6×30 sec sprint / 90 sec walk. No motor — your legs drive it.', rpe: 8, tags: ['cond', 'acc'] },
        { name: 'Rower — 500m repeats', desc: '4×500m, rest = work time ×1.5. Consistent splits — not faster first, dying last.', rpe: 8, tags: ['cond'] },
        { name: 'SkiErg — 1 min on / 2 min off', desc: '5 rounds at 85-90% max effort.', rpe: 8, tags: ['cond'] },
        { name: 'Basketball court repeat sprints', desc: '8×full court sprint / walk back.', rpe: 9, tags: ['cond', 'acc'] },
        { name: 'Assault bike + court sprint combo', desc: '4 rounds: 30s bike sprint + immediately 1 full court sprint.', rpe: 9, tags: ['cond', 'acc'] },
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
    cond: { protocols: [{ name: 'Easy bike or court jog', desc: '20 min at RPE 5-6 — aerobic flush. HR 130-150.', rpe: 5, tags: ['cond'] }] },
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
        { name: 'Assault bike — aerobic intervals', desc: '6 rounds: 30 sec moderate / 90 sec easy. RPE 6-7 — not all-out. Aerobic development without high CNS cost.', rpe: 6, tags: ['cond'] },
        { name: 'Rower — steady state', desc: '15-20 min at RPE 6. Consistent pace, nasal breathing if possible.', rpe: 6, tags: ['cond'] },
        { name: 'Easy court jog', desc: '15-20 min light jog. Movement prep, not conditioning.', rpe: 5, tags: ['cond'] },
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
        { name: 'Assault bike — Zone 2', desc: '20 min at RPE 5-6. Conversational pace. HR 130-150. Aerobic flush — supports recovery, not a training stimulus.', rpe: 5, tags: ['cond'] },
        { name: 'SkiErg — easy steady state', desc: '15 min easy. Breathing should be controlled throughout.', rpe: 5, tags: ['cond'] },
      ],
    },
  },

  // mod3: high fatigue — technique maintenance only, 55% load, bodyweight plyos.
  mod3: {
    acc: { agility: ['a_skips', 'b_skips', 'wall_starts'], plyo: ['pogo_jumps', 'snap_downs'], strength: ['bench_press'], build: ['walking_lunge_db', 'half_kneel_rot_chop'] },
    // NOTE: cable_woodchop below is referenced but not defined in EX. Known v9 bug.
    lat: { agility: ['lat_power_shuffle'], plyo: ['pogo_jumps', 'skater_jumps'], strength: ['blg_split_sq'], build: ['walking_lunge_db', 'cable_woodchop'] },
    lin: { agility: ['a_skips', 'b_skips'], plyo: ['pogo_jumps'], strength: ['bench_press'], build: ['walking_lunge_db', 'pallof_press'] },
    vel: { agility: ['a_skips', 'b_skips', 'high_knee_run'], plyo: ['pogo_jumps'], strength: ['trapbar_dl'], build: ['walking_lunge_db', 'single_leg_hip_thrust'] },
    cond: {
      protocols: [
        { name: 'Easy bike — active recovery', desc: '15 min very easy cycling. RPE 3-4. This is movement, not conditioning. HR should stay under 120.', rpe: 3, tags: ['cond'] },
        { name: 'Walking — active recovery', desc: '15-20 min walk. No intensity. Promotes circulation and tissue recovery.', rpe: 2, tags: ['cond'] },
      ],
    },
  },

  recovery: {
    acc: { agility: ['a_skips', 'b_skips'], plyo: ['pogo_jumps'], strength: ['bench_press'], build: ['half_kneel_rot_chop'] },
    lat: { agility: [], plyo: ['pogo_jumps', 'skater_jumps'], strength: ['blg_split_sq'], build: ['the_grappler'] },
    lin: { agility: [], plyo: [], strength: ['bench_press'], build: ['walking_lunge_db', 'cable_row_rotation', 'pallof_press'] },
    vel: { agility: ['a_skips', 'b_skips'], plyo: ['pogo_jumps'], strength: ['trapbar_dl'], build: ['single_leg_hip_thrust'] },
    cond: { protocols: [{ name: 'Easy bike (HR < 130)', desc: '15-20 min light aerobic — recovery flush only.', rpe: 4, tags: ['cond'] }] },
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
    cond: 'Zone 2 aerobic work only. 20 min max. HR 130-150. This is an aerobic flush — supports recovery rather than creating new training stress. No sprint intervals at this readiness level.',
  },
  mod3: {
    acc:  'High fatigue — tissue stress elevated. Mechanics work only: A/B skips, wall starts. Pogo jumps for lower leg stiffness — low CNS cost. Strength at 55%: motor pattern maintenance, not training stimulus. McGill: loading a fatigued system creates injury risk without corresponding adaptation.',
    lat:  'Pogo jumps and light skaters — no max landing demand. Shuffle only. BSQ at 55% — 3 sets, technique focus. Single rotation build exercise.',
    lin:  'Mechanics skips only. Pogo jumps. Bench at 55%. Your job today is to show up and move — not to train.',
    vel:  'High knee run and A/B skips. Pogo jumps. Trap bar at 55% — hip hinge pattern maintenance only. SBS data: strength maintenance requires only ~30-40% of the volume needed to build it.',
    cond: 'Active recovery movement only. Easy bike at RPE 3-4 or a walk. The goal is circulation and tissue recovery, not a training effect. HR under 120.',
  },
  recovery: {
    acc:  'Active recovery. Light skip work for mechanics, very light lifting. 30 min max. Nothing that creates new DOMS.',
    lat:  'Pogo jumps and bodyweight skaters at low intensity. Hip mobility module strongly recommended today.',
    lin:  'Skip agility. Light rotation work and core. Back prehab module ideal.',
    vel:  'A/B skips for mechanics — not speed. Light trap bar for hip hinge pattern only.',
    cond: 'Easy bike Zone 2 only. 15 min. No intervals, no sprints, no elevated HR.',
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
