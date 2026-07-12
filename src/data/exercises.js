// Exercise library — extracted verbatim from soccer_performance_coach_v9.html.
// Source of truth for: name, target/Rx, type, tags (day-type), cue, demo URL,
// optional measurement schema, optional upgrade variant, optional swap list.
//
// Keys are stable identifiers used in:
//   - SESSIONS programming (src/data/sessions.js)
//   - per-set logging (soccer_sets.exercise_key)
//   - per-exercise feedback (soccer_exercise_perf.exercise_key)
//   - intra-session load history lookups
// Do NOT rename a key without a migration plan for the Supabase rows that
// reference it.

const YT = (name) =>
  'https://www.youtube.com/results?search_query=' +
  encodeURIComponent(name + ' exercise drill');

export const EX = {
  // ─── AGILITY — Acceleration ────────────────────────────────
  falling_starts: {
    name: 'Falling starts', target: '4×10 yds', tags: ['acc'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/speed/acceleration/falling-starts/',
    cue: 'Lean until you MUST catch yourself. Forces golden position — forward shin angle, horizontal force production.',
  },
  wall_starts: {
    name: 'Wall starts', target: '4×5 sec', tags: ['acc'], type: 'agility',
    url: YT('wall starts acceleration drill'),
    cue: 'Drive knee high and hip forward — feel the horizontal force. Arms pump opposite to legs.',
  },
  two_pt_starts: {
    name: '2-point starts', target: '6×10 yds', tags: ['acc'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/speed/acceleration/2-point-start/',
    cue: 'First 3 steps — low angle, pushing back not up. Eyes stay forward.',
  },
  band_piston_run: {
    name: 'Band resisted piston run', target: '4×5 yds', tags: ['acc'], type: 'agility',
    url: YT('band resisted acceleration piston run'),
    cue: 'Band forces horizontal lean. Drive knees, not heels. Short powerful ground contacts.',
  },
  ball_drops: {
    name: 'Ball drops (react sprint)', target: '8×1 (build to longest)', tags: ['acc'], type: 'agility',
    url: YT('ball drop reaction sprint drill'),
    cue: 'React — first step wins. Drive horizontal out of reaction.',
  },
  decel_series: {
    name: 'Decel series (multi/2/1-step stop)', target: '2×20 yds each type', tags: ['acc'], type: 'agility',
    url: 'https://blog.overtimeathletes.com/deceleration-exercises-for-athletes-how-to-cut-harder-and-reduce-injury-risk/',
    cue: 'Own every landing position. Absorb through full ROM — soft landing = good decel = fast re-acceleration.',
  },
  half_kneel_starts: {
    name: 'Half-kneeling starts', target: '4×10 yds each side', tags: ['acc'], type: 'agility',
    url: YT('half kneeling start sprint drill'),
    cue: 'Drive the rear knee through, create positive shin angle immediately.',
  },

  // ─── AGILITY — Lateral ─────────────────────────────────────
  lat_power_shuffle: {
    name: 'Lateral power shuffle', target: '2×20 yds each', tags: ['lat'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/agility/change-of-direction/lateral-shuffle/',
    cue: 'Stay wide and low. Push laterally, not vertically. Big step, quick recovery.',
  },
  carioca_qstep: {
    name: 'Carioca quick step', target: '2×10 yds each direction', tags: ['lat'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/agility/change-of-direction/carioca/',
    cue: 'Push knee across — keep toes straight as long as possible. Hip drive is everything.',
  },
  mirror_drill: {
    name: 'Mirror drill', target: '4×5 sec', tags: ['lat'], type: 'agility',
    url: YT('mirror drill reactive agility'),
    cue: 'Stay in athletic stance. React to first movement — not to fakes. Low and ready.',
  },
  lat_shuffle_react: {
    name: 'Lateral shuffle to react sprint', target: '4×1', tags: ['lat'], type: 'agility',
    url: YT('lateral shuffle sprint reaction drill'),
    cue: 'Solo: shuffle 3 steps, plant hard and sprint on your own cadence. Plant outside foot hard — redirect energy into sprint. Hip leads.',
  },
  y_cut: {
    name: 'Y-cut with reaction', target: '4×1', tags: ['lat'], type: 'agility',
    url: YT('y cut agility drill'),
    cue: 'Penultimate step plants wide — next step redirects. Read the cue early.',
  },
  jump_cut: {
    name: 'Jump cut with reaction', target: '4×1', tags: ['lat'], type: 'agility',
    url: YT('jump cut agility drill'),
    cue: 'Two-foot plant — absorb and redirect simultaneously.',
  },
  half_arc_run: {
    name: 'Half arc run', target: '4×1 each direction', tags: ['lat'], type: 'agility',
    url: YT('half arc run agility drill'),
    cue: 'Inside foot leads the curve. Lean into the turn.',
  },

  // ─── AGILITY — Linear ──────────────────────────────────────
  two_pt_stop_go: {
    name: '2-point stop & go (off command)', target: '4×1', tags: ['lin'], type: 'agility',
    url: YT('stop and go acceleration drill'),
    cue: 'Brake hard, own position, re-accelerate. First step out of the stop is the skill.',
  },
  pro_shuttle: {
    name: 'Pro shuttle (5-10-5)', target: '2×1 each direction', tags: ['lin'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/agility/change-of-direction/pro-agility-shuttle/',
    cue: 'Plant outside foot at 5 yds — push horizontally, not a jump turn.',
  },
  l_drill: {
    name: 'L drill', target: '2×1 each direction', tags: ['lin'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/agility/change-of-direction/l-drill/',
    cue: 'Round the cone tightly — inside foot plants, hip drives direction.',
  },
  lat_shuffle_ball_drops: {
    name: 'Lateral shuffle ball drops', target: '8×1', tags: ['lin', 'lat'], type: 'agility',
    url: YT('lateral shuffle ball drop reaction drill'),
    cue: 'React, plant, catch. Lateral shuffle keeps hips loaded and ready.',
  },
  backpedal_ball_drops: {
    name: 'Back pedal ball drops', target: '8×1', tags: ['lin'], type: 'agility',
    url: YT('backpedal ball drop reaction drill'),
    cue: 'Stay on balls of feet. Quick to react and turn. Eyes forward.',
  },
  figure_8_drill: {
    name: 'Figure-8 drill', target: '2×1 each direction', tags: ['lin', 'lat'], type: 'agility',
    url: YT('figure 8 agility cone drill'),
    cue: 'Sharp entry and exit — decel into each curve, accelerate out.',
  },

  // ─── AGILITY — Max Velocity ────────────────────────────────
  high_knee_run: {
    name: 'High knee run', target: '2×10 yds', tags: ['vel'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/speed/max-velocity/high-knee-run/',
    cue: 'Cycle — not punch. Foot dorsiflexed, cycles through hip. Stay tall.',
  },
  butt_kick_run: {
    name: 'Butt kick run', target: '2×10 yds', tags: ['vel'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/speed/max-velocity/butt-kick/',
    cue: 'Hamstring pulls heel to butt — quick off the ground.',
  },
  a_skips: {
    name: 'A skips', target: '2×20 yds', tags: ['vel'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/speed/max-velocity/a-skip/',
    cue: 'Punch knee up, paw down. Opposite arm drives. Land on ball of foot.',
  },
  b_skips: {
    name: 'B skips', target: '2×20 yds', tags: ['vel'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/speed/max-velocity/b-skip/',
    cue: 'Full leg cycle — paw the ground down and back.',
  },
  sl_high_knee: {
    name: 'Single-leg high knee run', target: '2×10 yds each', tags: ['vel'], type: 'agility',
    url: YT('single leg high knee run speed drill'),
    cue: 'One leg drives — develops asymmetric power and balance at speed.',
  },
  sl_cycling: {
    name: 'Single-leg cycling', target: '2×10 yds each', tags: ['vel'], type: 'agility',
    url: YT('single leg cycling speed drill'),
    cue: 'Full hip extension, full cycle. Keep head still. Arms drive.',
  },
  str_leg_bounds: {
    name: 'Straight-leg bounds', target: '2×20 yds', tags: ['vel'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/power/horizontal/straight-leg-bounds/',
    cue: 'Stiff ankle, paw the ground. Cover distance with minimal ground contact.',
  },
  alternating_bounds: {
    name: 'Alternating bounds', target: '2×20 yds', tags: ['vel'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/power/horizontal/alternating-bounds/',
    cue: 'Drive knee through — reach for distance on each bound.',
  },
  step_over_runs: {
    name: 'Step-over runs', target: '4×50 yds', tags: ['vel'], type: 'agility',
    url: YT('step over run speed drill'),
    cue: 'High knee, step over, claw down. Good mechanics at speed.',
  },
  build_ups: {
    name: 'Build-ups (60%→max)', target: '4×50 yds', tags: ['vel'], type: 'agility',
    url: 'https://movements.overtimeathletes.com/speed/max-velocity/build-ups/',
    cue: 'Gradual acceleration — hit max velocity at 35-40 yds, hold for 10.',
  },

  // ─── PLYOMETRICS ───────────────────────────────────────────
  pogo_jumps: {
    name: 'Pogo jumps', target: '2×10 sec', tags: ['cond'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/pogo-jumps/',
    cue: 'Ankle joint only. Minimal knee bend. Rapid ground contact — like a bouncing ball.',
    upgrade: null,
  },
  squat_jumps: {
    name: 'Squat jumps', target: '4×8', tags: ['vel'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/squat-jump/',
    cue: 'Full squat, explosive extension. Stick landing soft.',
    upgrade: null,
  },
  broad_jump: {
    name: 'Broad jump', target: '4×3', tags: ['acc'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/horizontal/broad-jump/',
    measure: { label: 'Longest jump', unit: 'in', min: 24, max: 180, step: 1 },
    cue: 'Drive horizontally — swing arms, load hips, cover distance.',
    upgrade: {
      name: 'Band-resisted broad jumps',
      desc: 'Light band anchored behind hips. Slight backward pull forces better landing balance and develops horizontal power with added challenge. 4×3.',
      prereq: 'Broad jump distance is consistent and landings stable.',
      url: 'https://blog.overtimeathletes.com/resisted-broad-jumps-for-lower-body-power/',
    },
  },
  sl_broad_jump: {
    name: 'Single-leg broad jump', target: '4×3 each leg', tags: ['acc'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/horizontal/single-leg-broad-jump/',
    measure: { label: 'Longest jump (per leg)', unit: 'in', min: 24, max: 144, step: 1 },
    cue: 'Load through hip, drive knee — pure horizontal force production.',
    upgrade: {
      name: 'SL double/triple broad jump',
      desc: 'Land and immediately reload for a second (or third) jump without stopping. Develops rate of force development — reload and explode. 4×2 sequences.',
      prereq: 'Single broad jump is easy and distance is consistent.',
      url: 'https://movements.overtimeathletes.com/power/horizontal/single-leg-broad-jump/',
    },
  },
  sl_triple_jump: {
    name: 'Single-leg triple jump', target: '4×1 each leg', tags: ['acc', 'vel'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/horizontal/single-leg-triple-jump/',
    measure: { label: 'Total distance', unit: 'in', min: 36, max: 240, step: 2 },
    cue: 'Short ground contacts — reload and explode each landing.',
    upgrade: {
      name: 'SL triple jump from low box',
      desc: 'Start on 6-8" box, step off and execute triple jump immediately. Extra initial velocity into first contact challenges reactive strength beyond flat-ground version.',
      prereq: 'Flat-ground SL triple jump is dialed — consistent distance and landing control.',
      url: YT('single leg triple jump plyometric'),
    },
  },
  box_jump: {
    name: 'Box jump', target: '6×1', tags: ['vel', 'acc'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/box-jump/',
    measure: { label: 'Box height', unit: 'in', min: 12, max: 48, step: 2 },
    cue: 'Swing arms, extend fully, land soft on box. Step down — do not jump down.',
    upgrade: {
      name: 'Continuous hurdle hops',
      desc: 'Set 3-4 hurdles at hip height. Bounce over consecutively with minimal ground contact. Develops ankle stiffness and tendon elasticity at speed.',
      prereq: 'Box jumps feel easy and ground contact is quick and quiet.',
      url: YT('continuous hurdle hops plyometric'),
    },
  },
  approach_box_jump: {
    name: 'Approach box jump', target: '6×2', tags: ['vel'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/approach-box-jump/',
    measure: { label: 'Box height', unit: 'in', min: 12, max: 48, step: 2 },
    cue: '2-3 step approach, load, explode. Use momentum.',
    upgrade: null,
  },
  seated_box_jump: {
    name: 'Seated box jump (no CMJ)', target: '8×1', tags: ['acc'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/seated-box-jump/',
    cue: 'No stretch reflex — pure concentric power. Sit, pause briefly, explode.',
    upgrade: null,
  },
  sl_box_jump: {
    name: 'Single-leg box jump (land 2)', target: '4×1 each leg', tags: ['vel'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/single-leg-box-jump/',
    measure: { label: 'Box height', unit: 'in', min: 12, max: 48, step: 2 },
    cue: 'Drive off one foot, land controlled on both. Track knee over toe.',
    upgrade: null,
  },
  half_kneel_box_jump: {
    name: 'Half-kneeling box jump', target: '4×1 each side', tags: ['acc'], type: 'plyo',
    url: YT('half kneeling box jump'),
    measure: { label: 'Box height', unit: 'in', min: 12, max: 36, step: 2 },
    cue: 'Starting strength from dead position — drive through hip extension. No momentum.',
    upgrade: null,
  },
  snap_downs: {
    name: 'Snap downs', target: '8×1', tags: ['acc'], type: 'plyo',
    url: YT('snap down plyometric landing drill'),
    cue: 'Jump, snap feet down fast, absorb hard. Own the landing position completely.',
    upgrade: {
      name: 'High altitude drops (Bergles)',
      desc: 'Drop from significantly elevated height (24-36"). Hold one leg up, drive both feet down simultaneously before contact. Uses crossed-extensor reflex — massive eccentric impulse develops lower leg stiffness and elastic spring quality.',
      prereq: 'Standard snap downs feel controlled and landing is always stable.',
      url: 'https://www.tiktok.com/@joeybergles/video/7180516758015708462',
    },
  },
  depth_drops: {
    name: 'Depth drops', target: '8×1', tags: ['acc'], type: 'plyo',
    url: YT('depth drop plyometric landing'),
    cue: 'Step off, land and absorb — hips loaded, knees tracking toes. Own position.',
    upgrade: {
      name: 'Altitude drop leg to depth jump',
      desc: 'Hold one leg up, step off elevated box, snap both feet down, immediately rebound into max jump. Less time on ground = more elastic power. Advanced — earn this with perfect standard depth drops.',
      prereq: 'Depth drops are easy and ground contact is minimal.',
      url: 'https://www.tiktok.com/@joeybergles/video/7180516758015708462',
    },
  },
  skater_jumps: {
    name: 'Skater jumps', target: '4×4 each direction', tags: ['lat'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/horizontal/skater-jump/',
    measure: { label: 'Lateral distance per jump', unit: 'in', min: 12, max: 84, step: 2 },
    cue: 'Lateral leap, stick landing, minimal wobble. Cover distance each rep.',
    upgrade: {
      name: 'Reactive skater jumps (visual cue)',
      desc: 'Standard skater pattern but hold each landing until visual cue to redirect. Adds the reactive component — trains the read-react-redirect sequence specific to soccer cutting.',
      prereq: 'Skater jump landings are solid and controlled.',
      url: 'https://movements.overtimeathletes.com/power/horizontal/skater-jump/',
    },
  },
  ascending_skaters: {
    name: 'Ascending skater jumps', target: '2×10 yds each', tags: ['lat'], type: 'plyo',
    url: YT('ascending skater jumps lateral bounds'),
    measure: { label: 'Max lateral distance', unit: 'in', min: 12, max: 96, step: 2 },
    cue: 'Progressive lateral distance — each rep farther than the last.',
    upgrade: null,
  },
  lateral_bounds: {
    name: 'Lateral alternating bounds', target: '4×20 yds', tags: ['lat'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/horizontal/alternating-bounds/',
    cue: 'Maximum lateral distance per bound — stick each landing.',
    upgrade: null,
  },
  v_jumps: {
    name: 'V jumps', target: '4×1', tags: ['lat'], type: 'plyo',
    url: YT('v jump lateral plyometric'),
    cue: 'Explosive direction change in air — land and redirect.',
    upgrade: null,
  },
  russian_lunge: {
    name: 'Russian lunge', target: '4×4 each side', tags: ['lat', 'acc'], type: 'plyo',
    url: YT('russian lunge plyometric deceleration'),
    cue: 'Jump into lunge, lock hips instantly — isometric stabilization at landing.',
    upgrade: {
      name: 'Russian lunge to sprint',
      desc: 'Perform Russian lunge, immediately sprint out of the landing position on the final rep. Couples deceleration-absorption with re-acceleration — exactly the soccer cut pattern.',
      prereq: 'Russian lunges are stable and consistent — hip lock feels natural.',
      url: YT('russian lunge to sprint soccer drill'),
    },
  },
  russian_speed_lunge: {
    name: 'Russian speed lunge', target: '4×4 each side', tags: ['lat', 'acc'], type: 'plyo',
    url: YT('russian speed lunge plyometric'),
    cue: 'Quick hip switches at same level — do not rise between switches.',
    upgrade: null,
  },
  blg_squat_jump: {
    name: 'Bulgarian split squat jump', target: '4×4 each side', tags: ['acc', 'vel'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/bulgarian-split-squat-jump/',
    cue: 'Full range, explosive. Rear foot elevated — hip loaded. Land controlled.',
    upgrade: {
      name: 'BSQ jump to single-leg stick',
      desc: 'Max effort jump, land on SAME leg, stick for 3 sec. Isolates the unilateral landing — eccentric + isometric absorb. Extremely high transfer to soccer.',
      prereq: 'BSQ jumps feel explosive and controlled.',
      url: 'https://movements.overtimeathletes.com/power/vertical/bulgarian-split-squat-jump/',
    },
  },
  sprinter_step_up: {
    name: 'Sprinter step-up launch', target: '8×1 each side', tags: ['acc'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/vertical/sprinter-step-up/',
    cue: 'Drive knee through ceiling — vertical propulsion from one leg.',
    upgrade: null,
  },
  decel_step_up: {
    name: 'Decel sprinter step-up', target: '4×4 each side', tags: ['acc', 'lat'], type: 'plyo',
    url: YT('deceleration sprinter step up'),
    cue: 'Eccentric control on way down. Own position at bottom.',
    upgrade: null,
  },
  sl_snap_down: {
    name: 'Single-leg snap down', target: '4×1 each leg', tags: ['acc'], type: 'plyo',
    url: YT('single leg snap down landing drill'),
    cue: 'Jump forward, land one foot, absorb completely. Hip and ankle control.',
    upgrade: null,
  },
  mb_slam: {
    name: 'Med ball slam', target: '4×6', tags: ['vel'], type: 'plyo',
    url: 'https://movements.overtimeathletes.com/power/upper-body/med-ball-slam/',
    cue: 'Full extension overhead, violent slam — reset fast. Total body power.',
    upgrade: null,
  },
  mb_rotational_slam: {
    name: 'Rotational med ball slam', target: '4×5 each side', tags: ['lat'], type: 'plyo',
    url: YT('rotational med ball slam'),
    cue: 'Rotate and slam — hip drives the rotation, shoulders follow.',
    upgrade: null,
  },

  // ─── STRENGTH ──────────────────────────────────────────────
  trapbar_dl: {
    name: 'Trap bar deadlift', muscle: 'posterior chain', tags: ['str', 'vel'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/lower-body/trap-bar-deadlift/',
    cue: 'Hips back, chest tall, drive floor away. Hip extension finishes the lift.',
    swaps: [
      'Romanian deadlift (lower back — reduce ROM)',
      'Hex bar high handle (knee issue)',
      'BB rack pull from knee (upper back focus)',
      'DB sumo deadlift (no barbell)',
    ],
  },
  blg_split_sq: {
    name: 'Bulgarian split squat', muscle: 'quad/glute unilateral', tags: ['str', 'acc'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/lower/unilateral-strength/bulgarian-split-squats/',
    cue: 'Front shin vertical, drive through heel. Rear foot is just a kickstand.',
    swaps: [
      'DB reverse lunge elevated (less stability demand)',
      'Step-ups (knee issue)',
      'Single-leg press (equipment sub)',
      'Goblet squat (bilateral fallback)',
    ],
  },
  bench_press: {
    name: 'Bench press', muscle: 'push', tags: ['str'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/upper-body/bench-press/',
    cue: 'Scapulae retracted, bar to sternum, drive through chest.',
    swaps: [
      'DB bench press (no barbell)',
      'Floor press (shoulder issue)',
      'Larsen press (anterior shoulder sensitivity)',
      'Incline DB press (no flat bench)',
    ],
  },
  floor_press: {
    name: 'Floor press', muscle: 'push', tags: ['str'], type: 'strength',
    url: YT('floor press barbell'),
    cue: 'Upper arm hits floor between reps. Dead stop — pure concentric. More tricep than bench.',
    swaps: ['Bench press (standard)', 'DB floor press (no barbell)'],
  },
  overhead_press: {
    name: 'Standing overhead press', muscle: 'push', tags: ['str'], type: 'strength',
    url: YT('standing barbell overhead press military press form'),
    cue: 'Braced trunk, glutes squeezed, bar path straight over mid-foot. Head through the window at lockout. No leg drive — this is strict.',
    swaps: [
      'Seated DB press (shoulder mobility issue)',
      'Push press (need leg drive for load)',
      'Landmine press (unilateral / anterior shoulder friendly)',
    ],
  },
  pendlay_row: {
    name: 'Pendlay row (dead-stop)', muscle: 'pull', tags: ['str'], type: 'strength',
    url: YT('pendlay row form dead stop barbell'),
    cue: 'Bar starts on floor every rep. Torso ~parallel. Pull to lower chest, hips do not rise. Dead-stop between reps — no bounce.',
    swaps: [
      'Chest-supported T-bar row (lower-back sensitive)',
      'Barbell row (bent-over, not dead-stop)',
      'Meadows row (unilateral variation)',
    ],
  },
  nordic_curl: {
    name: 'Nordic hamstring curl', muscle: 'hamstring eccentric', tags: ['str', 'acc'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/lower-body/nordic-hamstring-curl/',
    cue: 'Slow controlled descent — as long as you can resist. Use hands to push back up.',
    swaps: [
      'Slider leg curl (no partner)',
      'Band SL hamstring curl',
      'Leg curl machine',
      'GHR machine',
    ],
  },
  single_leg_hip_thrust: {
    name: 'Single-leg hip thrust', muscle: 'glute', tags: ['str', 'acc'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/lower-body/single-leg-hip-thrust/',
    cue: 'Drive through heel, full hip extension at top. No lumbar hyperextension.',
    swaps: [
      'Bilateral barbell hip thrust',
      'Glute bridge SL bodyweight',
      'Cable pull-through',
      'KB swing',
    ],
  },
  pullup: {
    name: 'Pull-ups', muscle: 'back pull', tags: ['str'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/upper-body/pull-up/',
    cue: 'Dead hang start, scapulae depress first, chin clears bar.',
    swaps: ['Band-assisted pull-ups', 'Lat pulldown', 'Single-arm row', 'TRX row'],
  },
  single_arm_row: {
    name: 'Single-arm DB row', muscle: 'back unilateral', tags: ['str'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/upper-body/single-arm-row/',
    cue: 'Pull elbow to hip — not up. Slight rotation at top.',
    swaps: [
      'Cable single-arm row',
      'Incline chest-supported row',
      'Barbell row',
      'Band row',
    ],
  },
  goblet_lat_lunge: {
    name: 'Goblet lateral lunge', muscle: 'hip abductor', tags: ['str', 'lat'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/lower-body/lateral-lunge/',
    cue: 'Big step out, hips back — not knees forward. Feel adductor load.',
    swaps: ['Lateral band walk', 'Sumo goblet squat', 'Side step-up'],
  },
  pallof_press: {
    name: 'Pallof press', muscle: 'anti-rotation core', tags: ['str'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/core/pallof-press/',
    cue: 'Brace core, extend arms, resist rotation. Core fights the cable.',
    swaps: ['Band Pallof press', 'Half-kneeling cable chop', 'Swiss ball stir the pot'],
  },
  walking_kb_high_pull_coil: {
    name: 'Walking KB high pull coil', muscle: 'full body rotational', tags: ['str', 'acc'], type: 'strength',
    url: 'https://www.youtube.com/results?search_query=Judd+Lienhard+walking+KB+high+pull+coil',
    cue: 'Lienhard movement. Walk forward, on each step drive ipsilateral KB into a high pull while coiling the hip on that same side. The coil is the key — hip internally rotates as the KB drives up, mimicking the athletic hip sequencing in sprinting and shooting. 8 each side.',
    swaps: ['DB high pull coil', 'Stationary KB high pull'],
  },
  the_grappler: {
    name: 'The Grappler (cable rotation)', muscle: 'rotational power', tags: ['str', 'lat'], type: 'strength',
    url: 'https://www.youtube.com/results?search_query=Judd+Lienhard+grappler+cable+rotation',
    cue: 'Rope attachment at mid-height. Both hands on rope ends, stand perpendicular to cable. Knife-edge the back foot — press through inside edge, internally rotate hip. Pull rope horizontally across body. Hip drives first, shoulders follow AFTER. Rotate around your center of mass, not past your lead leg. Full hip coil at finish.',
    swaps: [
      'Single-arm cable horizontal row to rotation',
      'Band horizontal pull across body',
    ],
  },
  cable_row_rotation: {
    name: 'Single-arm cable row to rotation', muscle: 'rotational pull', tags: ['str', 'lat'], type: 'strength',
    url: 'https://www.youtube.com/results?search_query=single+arm+cable+row+rotation+athletic',
    cue: 'Cable at low height, single handle. Stand in split stance perpendicular to stack. Initiate with a lat row — elbow pulls back first. As elbow passes torso, let the shoulder open and torso rotate. The row creates pre-tension in the lat before the rotation fires — this is the athletic sequencing. 8 each side.',
    swaps: ['Band row to rotation', 'DB row to rotation on bench'],
  },
  cable_press_rotation: {
    name: 'Half-kneeling cable press to rotation', muscle: 'rotational push', tags: ['str', 'lat'], type: 'strength',
    url: 'https://www.youtube.com/results?search_query=half+kneeling+cable+press+rotation+athletic',
    cue: 'Half-kneeling, cable at shoulder height on same side as front knee. Shoulder move initiates first — press out and away, then torso rotates to follow. This trains the opposite kinetic chain to the row variation — push-side sequencing. 8 each side.',
    swaps: ['Band press rotation', 'Standing cable press rotation'],
  },
  walking_lunge_db: {
    name: 'Walking lunges (DB)', muscle: 'unilateral lower body', tags: ['str', 'acc'], type: 'strength',
    url: 'https://www.youtube.com/results?search_query=Judd+Lienhard+walking+lunge+dumbbell+athletic',
    cue: 'Full stride length — reach far enough that front shin stays vertical. Drive through front heel to stand. Lienhard emphasis: control the descent, then explosive drive up. Add light DBs for load. Can progress to walking lunge with contralateral reach (reach opposite hand toward lead foot at the bottom) for rotational component.',
    swaps: ['Bodyweight walking lunge', 'Reverse lunge (knee issues)', 'Goblet lunge'],
  },
  half_kneel_rot_chop: {
    name: 'Half-kneeling rotational chop flow', muscle: 'rotational core', tags: ['str', 'lat'], type: 'strength',
    url: 'https://www.youtube.com/results?search_query=half+kneeling+rotational+chop+flow+cable',
    cue: 'Half-kneeling at cable, cable high. Pull diagonally across body in a chopping pattern, letting the torso rotate fully. The "flow" part: do not stop at the end — transition smoothly back to start. Hip of front leg drives the rotation. 10 reps continuous per side.',
    swaps: ['Band chop', 'DB rotational chop'],
  },
  ab_wheel: {
    name: 'Ab wheel rollout', muscle: 'anti-extension core', tags: ['str'], type: 'strength',
    url: 'https://movements.overtimeathletes.com/strength/core/ab-wheel/',
    cue: 'Neutral spine — do not let hips sag. Control the way out as much as the way back.',
    swaps: ['TRX fallout', 'Dead bug', 'Hollow body hold'],
  },
};

// Working-max keys (Settings screen, load calc).
// Source: spec §7 + v9 MAXES_CONFIG.
export const MAXES_CONFIG = [
  { key: 'trapbar', label: 'Trap bar deadlift', placeholder: 'e.g. 315' },
  { key: 'bsq',     label: 'Back / front squat', placeholder: 'e.g. 225' },
  { key: 'bench',   label: 'Bench press', placeholder: 'e.g. 185' },
  { key: 'blgsq',   label: 'Bulgarian split squat', placeholder: 'e.g. 80 each' },
];

// Maps an exercise key to the working-max key used for load calc.
// Anything missing here = no recommended load.
export const EX_TO_MAX_KEY = {
  bench_press:   'bench',
  floor_press:   'bench',
  trapbar_dl:    'trapbar',
  blg_split_sq:  'blgsq',
};
