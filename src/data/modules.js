// Standalone mobility / prehab modules — extracted from v9 buildXContent()
// HTML builders into structured data for JSX rendering.
//
// Each module is { id, icon, label, sub, sections[] } where each section is
// { kind, title?, body, items? } with `kind` ∈ 'info' | 'warn' | 'phase' | 'items'.
// 'phase' is a titled paragraph block; 'items' is a checkable exercise list.
//
// Module-usage telemetry (timestamp open/close, duration, exercises checked
// off) is logged via the session store, not here.

const ytSearch = (q) =>
  'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

export const MODULES = [
  // ─── HIP MOBILITY ──────────────────────────────────────────
  {
    id: 'hip',
    icon: '⟳',
    label: 'Hip Mobility',
    sub: 'Daily routine · 10-15 min',
    sections: [
      {
        kind: 'info',
        body: 'Best done daily — morning or post-workout. Hip mobility directly improves sprint mechanics, cutting ability, and lower back health. Tighter hips = more lumbar stress.',
      },
      {
        kind: 'items',
        title: 'Hip Rotation',
        items: [
          {
            name: '90/90 Hip Flow',
            rx: '10 reps each side — slow and controlled',
            cue: 'Sit with both knees at 90°. Lean chest over front shin (external rotation), then rotate over rear leg (internal rotation). Each rep flows side to side. Feel the hip opening, not the back.',
            url: ytSearch('90 90 hip flow mobility exercise'),
          },
          {
            name: 'Hip CARs',
            rx: '3 circles each direction, each side',
            cue: 'Standing or quadruped. Femur traces the largest possible circle. Everything tense except the working hip joint. Promotes capsule health and end-range motor control.',
            url: ytSearch('hip CARs controlled articular rotation FRC'),
          },
          {
            name: 'Piriformis Figure-4 Stretch',
            rx: '45-60 sec each side',
            cue: 'Seated or supine. Cross ankle over opposite knee, pull toward chest or hinge forward. Deep posterior hip — piriformis and external rotators. Very common restriction in athletes.',
            url: ytSearch('figure 4 piriformis stretch seated'),
          },
        ],
      },
      {
        kind: 'items',
        title: 'Hip Flexor & Extension',
        items: [
          {
            name: 'Couch Stretch',
            rx: '60 sec each side, 2 rounds',
            cue: 'Rear shin against wall, front foot forward. Squeeze rear glute to deepen the stretch. Never arch the low back. Best hip flexor stretch available — targets rectus femoris and iliopsoas together.',
            url: ytSearch('couch stretch hip flexor wall'),
          },
          {
            name: 'Half-Kneeling Hip Flexor Stretch',
            rx: '5 reps each side — 5 sec squeeze at end range',
            cue: 'Kneeling lunge. Press hip forward, squeeze rear glute, add arm reach overhead for psoas lengthening. Can add dynamic PAILs at end range: push front foot into ground 10 sec, then reach further.',
            url: ytSearch('half kneeling hip flexor stretch lunge'),
          },
        ],
      },
      {
        kind: 'items',
        title: 'Adductor & Internal Rotation',
        items: [
          {
            name: 'Frog Stretch Rock-Back',
            rx: '10 slow reps',
            cue: 'Wide quadruped, feet out, knees wide. Rock hips back hard toward heels. Targets adductors and internal rotation — two of the most restricted ranges in athletes who sprint and cut.',
            url: ytSearch('frog stretch rock back adductor hip'),
          },
          {
            name: "World's Greatest Stretch",
            rx: '5 reps each side',
            cue: "Lunge with same-side elbow to floor, then rotate opposite arm to sky. Hits hip flexor, thoracic rotation, and hamstring in one rep. Used by every serious S&C program as a warmup staple.",
            url: ytSearch('worlds greatest stretch hip mobility thoracic'),
          },
        ],
      },
    ],
  },

  // ─── BACK PREHAB ───────────────────────────────────────────
  {
    id: 'back',
    icon: '◎',
    label: 'Back Prehab',
    sub: 'McGill Big 3 · ~10 min',
    sections: [
      {
        kind: 'info',
        body: 'McGill Big 3 — developed by Dr. Stuart McGill, Professor Emeritus of Spine Biomechanics, University of Waterloo. These exercises train the core to RESIST movement rather than create it. Research-backed for both back pain treatment and injury prevention in athletes.',
      },
      {
        kind: 'warn',
        body: '⚠ If any exercise increases pain, radiating symptoms, numbness, or tingling — stop immediately and consult a clinician. This is a general prehab protocol, not a substitute for individual assessment.',
      },
      {
        kind: 'phase',
        title: '5-3-1 Descending Pyramid',
        body: 'Perform 5 holds, rest 10-15 sec, then 3 holds, rest, then 1 hold. Each hold = 8-10 seconds with controlled breathing. Complete one side fully before switching for unilateral exercises. All 3 exercises = ~10 minutes.',
      },
      {
        kind: 'items',
        title: 'Exercise 1 — Anterior (Modified Curl-Up)',
        items: [
          {
            name: 'Modified Curl-Up',
            rx: '5-3-1 pyramid × 8-10 sec holds each side',
            cue: 'Lie on back, one knee bent, one leg straight. Hands under lumbar arch to maintain neutral spine. Lift head and shoulders as ONE rigid unit — do not tuck chin or flatten the low back. Lift only until shoulder blades hover. This is NOT a crunch. Crunches create spinal flexion under load. This trains anterior stiffness with minimal disc compression.',
            url: ytSearch('McGill modified curl up correct form spine'),
          },
        ],
      },
      {
        kind: 'items',
        title: 'Exercise 2 — Lateral (Side Plank)',
        items: [
          {
            name: 'Side Plank',
            rx: '5-3-1 pyramid × 8-10 sec holds each side',
            cue: 'Elbow under shoulder, feet staggered (regression: knees bent). Lift hips — body is a rigid plank from head to feet. Squeeze glutes and brace core simultaneously. Targets quadratus lumborum and obliques. Do not let hips sag or rotate. McGill calls this the gold standard lateral stabilizer.',
            url: ytSearch('McGill side plank form quadratus lumborum'),
          },
        ],
      },
      {
        kind: 'items',
        title: 'Exercise 3 — Posterior / Anti-Rotation (Bird Dog)',
        items: [
          {
            name: 'Bird Dog',
            rx: '5-3-1 pyramid × 8-10 sec holds each side',
            cue: 'Quadruped, neutral spine. Make a fist with working hand, foot flexed. Extend opposite arm and leg until parallel to floor. No hip rotation, no low back sag. Hold, then "sweep" back without touching floor between reps to maintain tension. Trains co-contraction and teaches the CNS to protect the spine under moving limb loads.',
            url: ytSearch('McGill bird dog correct form neutral spine'),
          },
        ],
      },
      {
        kind: 'phase',
        title: 'When to advance',
        body: 'Once 10-sec holds feel controlled, extend to 15 sec. Bird dog: add squares — draw a small square in space with hand and heel while holding. Side plank: knees → staggered feet → stacked feet → top leg raise.',
      },
    ],
  },

  // ─── KNEE REHAB ────────────────────────────────────────────
  {
    id: 'knee',
    icon: '⊕',
    label: 'Knee Rehab',
    sub: 'ACL / general · phased protocol',
    sections: [
      {
        kind: 'warn',
        body: '⚠ This is a general reference protocol based on published ACL rehab research (MOON, JOSPT, MGH, OrthoVirginia). It is NOT a substitute for care from a licensed physical therapist. Do not use this immediately post-surgery without PT supervision. Consult your surgeon before beginning any phase.',
      },
      {
        kind: 'phase',
        title: 'Phase 1 — Goals (Weeks 0-4)',
        body: 'Protect graft. Restore full passive extension (0° — critical before everything else). Manage swelling. Re-establish quad control and normal gait.',
      },
      {
        kind: 'items',
        title: 'Phase 1 — Immediate (Weeks 0-4)',
        items: [
          { name: 'Quad Sets', rx: '3×10 reps, 10 sec holds', cue: 'Lie flat, push back of knee into floor, tighten quad without lifting leg. First step to reactivating the quad post-surgery. Hold the muscle contraction, not just the position.', url: ytSearch('quad sets ACL rehabilitation quadriceps activation') },
          { name: 'Heel Slides', rx: '3×15 reps', cue: 'Supine, slide heel toward glute to flex knee, then return. Restore ROM without forcing. Pain-free range only.', url: ytSearch('heel slides knee rehabilitation ROM') },
          { name: 'Straight Leg Raise (SLR)', rx: '3×10 reps (only after quad sets are solid)', cue: 'Tighten quad fully, then lift leg to height of opposite knee. No knee bend as you lift — that is quad lag, meaning insufficient quad activation. Progress to this from quad sets.', url: ytSearch('straight leg raise ACL rehab no quad lag') },
          { name: 'Ankle Pumps', rx: '3×20 reps, frequently throughout day', cue: 'Pump ankle up and down. Maintains circulation, reduces swelling, prevents DVT risk. Do every hour post-surgery.', url: ytSearch('ankle pumps post surgery circulation') },
        ],
      },
      {
        kind: 'phase',
        title: 'Phase 2 — Goals (Weeks 4-12)',
        body: 'Full ROM. Wean off crutches. Begin closed-chain loading. Normalize gait. Single-leg balance.',
      },
      {
        kind: 'items',
        title: 'Phase 2 — Early Strength',
        items: [
          { name: 'Mini Squat / Wall Slide', rx: '3×10 reps, 0-45° depth only', cue: 'Controlled depth, no pain. Closed kinetic chain — safer for graft than open chain loading early on.', url: ytSearch('mini squat wall slide ACL rehabilitation phase 2') },
          { name: 'Terminal Knee Extension (TKE)', rx: '3×15 reps', cue: 'Band behind knee, stand on surgical leg, press knee to full extension against band resistance. Targets VMO (inner quad) that atrophies fastest post-ACL injury.', url: ytSearch('terminal knee extension TKE band ACL VMO') },
          { name: 'Single-Leg Balance', rx: '3×30 sec each leg', cue: 'Progress: stable surface → eyes closed → unstable surface. Restores proprioception lost after ACL injury — a major re-injury risk factor.', url: ytSearch('single leg balance proprioception ACL rehab') },
          { name: 'Step-Ups', rx: '3×10 each leg — 6-8" step', cue: 'Controlled step-down is the key — lower slowly (eccentric). Builds quad and glute symmetry between legs.', url: ytSearch('step up eccentric step down ACL rehabilitation') },
        ],
      },
      {
        kind: 'phase',
        title: 'Phase 3 — Goals (Months 3-6)',
        body: 'Limb Symmetry Index ≥80% on strength testing. Full ROM. No swelling. Normal gait. PT clearance for return-to-run.',
      },
      {
        kind: 'items',
        title: 'Phase 3 — Return to Running',
        items: [
          { name: 'Bulgarian Split Squat', rx: '3×8 each leg', cue: 'Full unilateral loading. Compare side-to-side carefully. Do not progress until symmetry is solid — asymmetry is the primary re-injury predictor.', url: 'https://movements.overtimeathletes.com/strength/lower/unilateral-strength/bulgarian-split-squats/' },
          { name: 'Nordic Hamstring Curl', rx: '3×5 reps — maximal eccentric', cue: 'Critical for ACL re-injury prevention. Hamstring weakness is a primary re-tear risk factor. 3-5 sec slow eccentric minimum. Use hands to push back up.', url: 'https://movements.overtimeathletes.com/strength/lower-body/nordic-hamstring-curl/' },
          { name: 'Lateral Band Walk', rx: '3×15 each direction', cue: 'Hip abductor strength prevents valgus collapse on landing — the mechanism of ACL re-tear. Non-negotiable.', url: ytSearch('lateral band walk hip abductor ACL prevention') },
        ],
      },
      {
        kind: 'phase',
        title: 'Phase 4 — Return to Sport (6-12 months)',
        body: 'LSI ≥90% quad strength. LSI ≥90% hop tests (single-leg, triple-hop, crossover-hop). Psychological readiness. Surgeon + PT clearance. Research shows athletes cleared at 6 months have 6× higher re-tear rates than those cleared at 9+ months. Do not rush this.',
      },
    ],
  },

  // ─── SHOULDER ──────────────────────────────────────────────
  {
    id: 'shoulder',
    icon: '↕',
    label: 'Shoulder',
    sub: 'Mobility & health · 10 min',
    sections: [
      {
        kind: 'info',
        body: 'Shoulder mobility and stability for field athletes. This routine addresses the posterior capsule, rotator cuff, and scapular control — the three areas that degrade in athletes who press, throw, and absorb contact.',
      },
      {
        kind: 'items',
        title: 'Joint Mobility',
        items: [
          { name: 'Shoulder CARs', rx: '5 slow circles each direction, each side', cue: 'Arm traces the largest possible circle at end range of shoulder. Everything tense except the working arm. Promotes synovial fluid, maintains joint health, identifies restrictions before they become injuries.', url: ytSearch('shoulder CARs controlled articular rotation FRC') },
          { name: 'Sleeper Stretch', rx: '3×30 sec each side', cue: 'Lie on side, working shoulder down, push wrist toward floor into internal rotation. Targets the posterior capsule — tightness here is associated with labral stress and impingement syndrome. Do not force. Controlled stretch only.', url: ytSearch('sleeper stretch shoulder posterior capsule form') },
          { name: 'Cross-Body Horizontal Adduction', rx: '3×30 sec each side', cue: 'Pull arm across chest at shoulder height. Stretches posterior shoulder and infraspinatus. Pair with sleeper stretch for full posterior capsule work.', url: ytSearch('cross body shoulder stretch horizontal adduction posterior') },
        ],
      },
      {
        kind: 'items',
        title: 'Rotator Cuff & Scapular Stability',
        items: [
          { name: 'Band Pull-Aparts', rx: '3×15 reps', cue: 'Arms straight in front, pull band apart to T position. Targets rear delt and external rotators. Do these every session. They balance out horizontal pressing and counteract the forward shoulder posture athletes develop.', url: ytSearch('band pull aparts shoulder external rotation') },
          { name: 'Wall Slides', rx: '3×10 reps', cue: 'Forearms against wall, slide arms overhead while keeping full contact. Tests and trains serratus anterior and lower trap. Inability to do this cleanly indicates scapular dyskinesis — address before loading overhead.', url: ytSearch('wall slides shoulder scapular serratus anterior') },
          { name: 'Y-T-W (Prone)', rx: '3×8 reps each position', cue: 'Lie prone, raise arms in Y, T, and W positions separately. Each fires a different scapular stabilizer. Use very light weight or bodyweight. Control is the entire point — not load.', url: ytSearch('prone YTW shoulder scapular stability lower trap') },
          { name: 'External Rotation — Band or Cable', rx: '3×12 each side — slow tempo', cue: 'Elbow at 90°, upper arm fixed, rotate forearm outward against band resistance. Infraspinatus and teres minor. Primary rotator cuff injury prevention. Never rush these.', url: ytSearch('external rotation band shoulder rotator cuff infraspinatus') },
        ],
      },
    ],
  },

  // ─── ANKLE & LOWER LEG ─────────────────────────────────────
  {
    id: 'ankle',
    icon: '⌇',
    label: 'Ankle & Lower Leg',
    sub: 'Stiffness & mobility · 8 min',
    sections: [
      {
        kind: 'info',
        body: 'Lower leg stiffness is a prerequisite for sprint quality and landing mechanics. Joey Bergles specifically calls this out: an undertrained lower leg creates an energy leak on every ground contact. Stiff tendons = elastic return = faster and more efficient movement.',
      },
      {
        kind: 'items',
        title: 'Mobility',
        items: [
          { name: 'Ankle CARs', rx: '5 slow circles each direction, each side', cue: 'Full dorsiflexion → plantar flexion → inversion → eversion circle. Slow enough to feel every part of the range. Joint health maintenance — especially important for athletes who land and cut repetitively.', url: ytSearch('ankle CARs controlled articular rotation mobility') },
          { name: 'Ankle Dorsiflexion PAILs/RAILs', rx: '90 sec hold → 2× PAILs/RAILs cycles each side', cue: 'Half-kneeling lunge, heel flat on floor, shin drives forward. PAILs: press heel into ground (contracting INTO the stretch). RAILs: pull shin forward further. Most common restriction for athletes — limited dorsiflexion forces compensation at the knee and hip.', url: ytSearch('ankle dorsiflexion PAILs RAILs FRC half kneeling') },
          { name: 'Banded Ankle Distraction', rx: '60 sec each side', cue: 'Band around ankle joint (at the joint line, not the foot), pull anteriorly toward toes. Drop into deep lunge. Creates joint space and improves dorsiflexion ROM mechanically.', url: ytSearch('banded ankle distraction dorsiflexion joint mobilization') },
        ],
      },
      {
        kind: 'items',
        title: 'Stiffness & Strength',
        items: [
          { name: 'Loaded SL Calf Isometric Hold', rx: '3×45-60 sec each side — add weight', cue: 'Mid-range heel raise (not the top), hold with weight in same-side hand or backpack. Develops tendon stiffness = elastic energy return at ground contact. Bergles: this is a prerequisite for high-quality sprinting. Not optional.', url: ytSearch('single leg calf isometric hold loaded tendon stiffness') },
          { name: 'Tibialis Anterior Wall Hold', rx: '3×30 sec each side', cue: 'Stand facing wall, foot dorsiflexed, press foot into wall. Anterolateral lower leg — the braking side of the ankle. Dramatically undertrained. Critical for deceleration control and cutting stability.', url: ytSearch('tibialis anterior wall isometric shin exercise') },
          { name: 'Eccentric SL Calf Raise', rx: '3×10 each side — 3 sec down', cue: 'Rise on two feet, lower slowly on one. Full plantar flexion to full dorsiflexion. Achilles and calf tendon eccentric loading. Essential injury prevention for any athlete running and jumping.', url: ytSearch('eccentric single leg calf raise Achilles tendon') },
          { name: 'Pogo Jumps — Ankle Stiffness Focus', rx: '3×10 sec', cue: 'Minimal knee bend. Ankle joint drives everything. Stiff spring, not a squat jump. Rapid ground contact — like a bouncing ball. This builds the elastic lower leg quality that transfers to every sprint and plyo.', url: 'https://movements.overtimeathletes.com/power/vertical/pogo-jumps/' },
        ],
      },
    ],
  },

  // ─── ROTATION & POWER ──────────────────────────────────────
  {
    id: 'rotation',
    icon: '↺',
    label: 'Rotation & Power',
    sub: 'Lienhard cable series · 20-25 min',
    sections: [
      {
        kind: 'info',
        body: "Judd Lienhard's cable rotation series — his signature training approach. The key principle: the body does not move simultaneously. In all athletic rotation (kicking, throwing, cutting), the kinetic chain sequences from the ground up: foot knife-edge → hip internally rotates → torso follows → shoulder last. These exercises train that exact sequence under load.",
      },
      {
        kind: 'phase',
        title: 'The sequence (always in this order)',
        body: '1. Knife-edge the back foot (press through the inside edge). 2. Internally rotate the hip on that side. 3. Torso rotates. 4. Shoulder follows last. You do NOT want hip and shoulder to move together — create the stretch between them first, which creates potential energy. Rotate around your center of mass, not past your lead leg.',
      },
      {
        kind: 'items',
        title: 'The Grappler',
        items: [
          { name: 'The Grappler — cable horizontal pull', rx: '2-3 × 8 each side · rope attachment mid-height', cue: 'Stand perpendicular to cable, both hands on rope ends (knotted woven rope works perfectly). Feet in athletic stance. Back foot knife-edges, hip coils, then pull rope horizontally across body. Both arms pull simultaneously. Hip drives first — shoulder follows. Rotate around center of mass. Full coil at finish, hold 1 sec.', url: ytSearch('Judd Lienhard grappler cable rotation MASS method') },
        ],
      },
      {
        kind: 'items',
        title: 'Row-First Variation',
        items: [
          { name: 'Single-arm cable row to rotation', rx: '3 × 8 each side · low cable, single handle', cue: 'Split stance perpendicular to cable. Pull with one arm in a lat row — elbow drives back first, scapula retracts. As elbow passes torso, let shoulder open and torso rotate to follow. The row pre-loads the lat before rotation fires. This is the athletic sequencing of a pass, shot, or throw — the pull creates the coil.', url: ytSearch('single arm cable row rotation athletic rotational power') },
        ],
      },
      {
        kind: 'items',
        title: 'Shoulder-First Variation',
        items: [
          { name: 'Half-kneeling cable press to rotation', rx: '3 × 8 each side · cable at shoulder height', cue: 'Half-kneeling, cable on same side as front knee. Press shoulder out first — shoulder initiates, torso rotates to follow. This is the inverse of the row variation: trains the push-side kinetic chain. The shoulder moves first and the hip responds. Balances the pull-dominant rotation training.', url: ytSearch('half kneeling cable press rotation core rotation') },
        ],
      },
      {
        kind: 'items',
        title: 'Chop Flow',
        items: [
          { name: 'Half-kneeling rotational chop flow', rx: '2 × 10 continuous each side · high cable', cue: 'Half-kneeling at cable, cable set high. Pull diagonally across body in a chopping arc. Do not stop at end position — flow continuously back and return. Hip of front leg drives each rep. 10 fluid reps. This is the Lienhard "flow" concept: continuous, rhythmic movement that trains the pattern neurologically, not just strength.', url: ytSearch('half kneeling rotational chop flow cable athletic') },
        ],
      },
      {
        kind: 'items',
        title: 'Walking Lunge Series (DB)',
        items: [
          { name: 'Walking lunge with DBs', rx: '3 × 10 each leg', cue: 'Full stride length — reach far enough that front shin stays vertical. DBs in hands, neutral grip. Controlled descent, then explosive drive through front heel. Lienhard emphasis on stride length and control of the deceleration phase — the bottom of the lunge is where the athletic quality lives.', url: ytSearch('Judd Lienhard walking lunge dumbbell') },
          { name: 'Walking lunge with contralateral reach', rx: '2 × 8 each leg', cue: 'Same as above, but at the bottom of each lunge, reach the opposite hand toward the lead foot. Creates a rotational component — the reach opens the thoracic spine and challenges anti-rotation control. Progress to this after basic walking lunges feel solid.', url: ytSearch('walking lunge contralateral reach rotation core') },
        ],
      },
      {
        kind: 'items',
        title: 'Walking KB High Pull Coil',
        items: [
          { name: 'Walking KB high pull coil', rx: '2 × 8 each side', cue: 'Walk forward. On each step, drive the ipsilateral KB into a high pull while coiling the hip on that same side — the hip internally rotates as the KB drives up. This mimics the exact hip sequencing in sprinting acceleration and striking. Lienhard uses this as a bridge between strength and speed work.', url: ytSearch('Judd Lienhard walking KB high pull coil MASS method') },
        ],
      },
      {
        kind: 'phase',
        title: 'Why this matters for you at 44',
        body: 'Hip rotation is the primary power source in soccer — every shot, pass, and cut draws from it. As athletes age, the tendency is to rely more on arm strength and lose the hip-leads-shoulder sequencing. These exercises specifically re-groove that pattern under load. At 44, training rotational power intelligently maintains the neurological efficiency of these movement patterns — which declines faster than raw strength without targeted work.',
      },
    ],
  },
];
