// FRC mobility content + OTA dynamic warm-up. Extracted from
// soccer_performance_coach_v9.html.
//
// FRC_SHORT — pre-session, ~8 min, shown on the Warm-up tab.
// FRC_FULL  — post-conditioning, ~20 min, shown on the Conditioning tab.
// WARMUP    — OTA Dynamic Warm-Up, 13 items with a "Check All" affordance.

export const WARMUP_OTA_URL =
  'https://movements.overtimeathletes.com/stretches-activation-2/dynamic/dynamic-warm-up/';

export const WARMUP = [
  'High knee tuck — 10 yds',
  'High knee run (lotta steps) — 10 yds',
  'Hurdler stretch (heel to butt, push hip fwd) — 10 yds',
  'Butt kick run — 10 yds',
  'Straight leg march (kick to hand) — 10 yds',
  'Lunge with arm reach — 10 yds',
  'Reverse lunge — 10 yds',
  'Lateral lunge (hips back) — both directions',
  'Waiter bows (flat back) — 10 yds',
  '10 bodyweight squats (hands behind head)',
  'Low lateral shuffle — both directions',
  'Karaoke quick step — both directions',
  'Monster walk fwd/back (hip circle band) — 10 yds',
];

export const FRC_SHORT = [
  {
    text: 'Hip CARs — slow full-circle rotation, 3x each direction each side',
    badge: 'CARs',
    cue: 'Femur traces largest possible circle. Trunk and opposite leg stay completely still. Everything under tension except the working joint.',
    url: 'https://www.youtube.com/results?search_query=hip+CARs+controlled+articular+rotation',
  },
  {
    text: 'Ankle CARs — 3x each direction each side',
    badge: 'CARs',
    cue: 'Full dorsiflexion → plantar flexion → inversion → eversion. Key for sprint mechanics and landing resilience.',
    url: 'https://www.youtube.com/results?search_query=ankle+CARs+controlled+articular+rotation+FRC',
  },
  {
    text: 'Thoracic rotation CARs — hands on head, 3x each side',
    badge: 'CARs',
    cue: 'Isolate thoracic. Lumbar stays still. Reach for maximum rotation.',
    url: 'https://www.youtube.com/results?search_query=thoracic+rotation+CARs+FRC+mobility',
  },
  {
    text: 'Hip 90/90 PAILs/RAILs — 2 min hold → PAILs 10 sec → RAILs 10 sec, each side',
    badge: 'PAILs/RAILs',
    cue: 'PAILs: push floor-side knee into ground (contracting INTO stretch). RAILs: pull yourself deeper, opposing hip working. Ramp tension slowly to ~80% max. Never force.',
    url: 'https://www.youtube.com/results?search_query=hip+90+90+PAILs+RAILs+FRC',
  },
  {
    text: 'Ankle dorsiflexion PAILs/RAILs — half-kneeling lunge, 90 sec → 2x cycles each side',
    badge: 'PAILs/RAILs',
    cue: 'Heel flat, shin drives forward. PAILs: press heel into ground. RAILs: pull shin forward further. Highest carry-over FRC drill for sprinting and cutting.',
    url: 'https://www.youtube.com/results?search_query=ankle+dorsiflexion+PAILs+RAILs+FRC',
  },
];

export const FRC_FULL = [
  {
    text: 'Hip CARs — 5x each direction each side. Slower than you think necessary.',
    badge: 'CARs',
    url: 'https://www.youtube.com/results?search_query=hip+CARs+controlled+articular+rotation',
  },
  {
    text: 'Ankle CARs — 5x each direction each side',
    badge: 'CARs',
    url: 'https://www.youtube.com/results?search_query=ankle+CARs+controlled+articular+rotation+FRC',
  },
  {
    text: 'Thoracic rotation CARs — 5x each side',
    badge: 'CARs',
    url: 'https://www.youtube.com/results?search_query=thoracic+rotation+CARs+FRC+mobility',
  },
  {
    text: 'Shoulder CARs — arm traces largest possible circle, 3x each direction each side',
    badge: 'CARs',
    cue: 'Keep scapula engaged. Circle should feel like it tests your limit in every direction.',
    url: 'https://www.youtube.com/results?search_query=shoulder+CARs+controlled+articular+rotation+FRC',
  },
  {
    text: 'Hip 90/90 PAILs/RAILs — 3 min passive hold → 3x PAILs/RAILs cycles, each side',
    badge: 'PAILs/RAILs',
    cue: 'Full protocol: hold, breathe, ramp tension progressively. Rest 60 sec between sides.',
    url: 'https://www.youtube.com/results?search_query=hip+90+90+PAILs+RAILs+FRC',
  },
  {
    text: 'Hip internal rotation PAILs/RAILs — seated IR stretch → 3x cycles each side',
    badge: 'PAILs/RAILs',
    cue: 'Seated, shin perpendicular. Rotate thigh inward. PAILs = push shin outward, RAILs = pull deeper into IR.',
    url: 'https://www.youtube.com/results?search_query=hip+internal+rotation+PAILs+RAILs+FRC',
  },
  {
    text: 'Ankle dorsiflexion PAILs/RAILs — 3 min hold → 3x cycles each side',
    badge: 'PAILs/RAILs',
    url: 'https://www.youtube.com/results?search_query=ankle+dorsiflexion+PAILs+RAILs+FRC',
  },
  {
    text: 'Couch stretch (hip flexor) PAILs/RAILs — 2 min → 2x cycles each side',
    badge: 'PAILs/RAILs',
    cue: 'Rear shin against wall. PAILs = press rear shin backward into wall. RAILs = pull hip further into extension.',
    url: 'https://www.youtube.com/results?search_query=couch+stretch+PAILs+RAILs+hip+flexor+FRC',
  },
  {
    text: 'Loaded SL calf isometric hold — mid-range heel raise, hold 45-60 sec, 3x each side',
    badge: 'Lower leg',
    cue: 'Mid-range (not top), knee soft, hip-loaded stance. Add weight same side as stance leg. Lower leg stiffness is a prerequisite for high-quality sprinting — Bergles.',
    url: 'https://www.youtube.com/results?search_query=single+leg+calf+isometric+hold+loaded',
  },
  {
    text: 'Tibialis wall hold — dorsiflexed foot pressed against wall, 3x30 sec each side',
    badge: 'Lower leg',
    cue: 'Anterolateral lower leg — undertrained in most athletes. Strengthens the braking side of the ankle for decel and cutting.',
    url: 'https://www.youtube.com/results?search_query=tibialis+anterior+wall+hold+isometric',
  },
];
