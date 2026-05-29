// HR zone helpers — 5-zone standard (Z1–Z5) anchored to the athlete's
// calibrated working HRmax (185 bpm — see WORKING_HRMAX in sessions.js for
// the derivation: Nes 2013 + user-reported 180 = submaximal data point).
//
// Used by Recent workouts card (zone badge per workout) and the Today
// prescription banner (today's prescribed cond protocol → did the workout's
// avg HR hit it?).

import { WORKING_HRMAX } from '../data/sessions';

// Per-zone metadata (codes, labels, colors) is HRmax-independent; only the
// bpm break points scale with HRmax. Colors map to the existing CSS vars used
// by CNSBudgetCard / ACWRCard so chips look at-home on Today.
//   green = aerobic territory (Z1, Z2) — recovery / base
//   blue  = Z3 — tempo / sweet spot
//   amber = Z4 — threshold (productive but costly)
//   red   = Z5 — VO2max territory (high CNS / cardio cost)
export const ZONE_META = {
  Z1: { code: 'Z1', label: 'Recovery',  color: 'var(--green)' },
  Z2: { code: 'Z2', label: 'Aerobic',   color: 'var(--green)' },
  Z3: { code: 'Z3', label: 'Tempo',     color: 'var(--blue)'  },
  Z4: { code: 'Z4', label: 'Threshold', color: 'var(--amber)' },
  Z5: { code: 'Z5', label: 'VO2max',    color: 'var(--red)'   },
};

// Build the zone table (bpm break points) for a given HRmax. Standard 5-zone
// %HRmax model used widely in endurance literature (Seiler polarized, ACSM).
// Z5 ceiling is HRmax itself; treat anything above as Z5. Default arg keeps
// every existing caller working against the configured working HRmax; pass a
// calibrated value to scale the zones to the athlete's observed max.
export function zonesFor(hrMax = WORKING_HRMAX) {
  const z1 = Math.round(hrMax * 0.60);
  const z2 = Math.round(hrMax * 0.70);
  const z3 = Math.round(hrMax * 0.80);
  const z4 = Math.round(hrMax * 0.90);
  return {
    Z1: { ...ZONE_META.Z1, low: 0,      high: z1 },
    Z2: { ...ZONE_META.Z2, low: z1 + 1, high: z2 },
    Z3: { ...ZONE_META.Z3, low: z2 + 1, high: z3 },
    Z4: { ...ZONE_META.Z4, low: z3 + 1, high: z4 },
    Z5: { ...ZONE_META.Z5, low: z4 + 1, high: hrMax },
  };
}

// Default zone table at the configured working HRmax (185). Kept as a named
// export for back-compat with callers that don't do dynamic calibration.
export const ZONES = zonesFor(WORKING_HRMAX);

// Calibrated HRmax from observed workout maxes. The configured WORKING_HRMAX
// (185, a validated estimate) is the FLOOR — we only ever raise it when the
// athlete demonstrably exceeds it, never lower it below the estimate. Caps at
// 210 to reject sensor artifacts (chest-strap dropouts, watch glitches spike
// HR readings into the 200s+). Matches the edge function's calibration so
// stored zone-times and live zone chips agree.
export const HRMAX_CEIL = 210;
export function calibratedHRmax(observedMaxes = []) {
  let best = WORKING_HRMAX;
  for (const m of observedMaxes) {
    const n = Number(m);
    if (Number.isFinite(n) && n > best && n <= HRMAX_CEIL) best = n;
  }
  return best;
}

// Return the zone object for a given avg-HR reading. Null in → null out so
// callers can decide whether to render the chip at all. Pass hrMax to score
// against a calibrated max instead of the default.
export function zoneOf(bpm, hrMax = WORKING_HRMAX) {
  if (bpm == null || !Number.isFinite(bpm) || bpm <= 0) return null;
  const Z = zonesFor(hrMax);
  if (bpm <= Z.Z1.high) return Z.Z1;
  if (bpm <= Z.Z2.high) return Z.Z2;
  if (bpm <= Z.Z3.high) return Z.Z3;
  if (bpm <= Z.Z4.high) return Z.Z4;
  return Z.Z5;
}

// Compare an actual avg HR to a prescribed range. Used by the today banner.
//   status: 'hit'    — actual is within [low, high]
//           'under'  — actual is below the low bound (worked too easy)
//           'over'   — actual is above the high bound (worked too hard)
//           'none'   — missing input
// A prescribed range with only an upper bound (e.g. "under ~115 bpm" for
// recovery work) is OK — pass low=null and we'll only check the ceiling.
export function compareToPrescription(actual, low, high) {
  if (actual == null || !Number.isFinite(actual)) return { status: 'none' };
  if (low == null && high == null) return { status: 'none' };
  if (low != null && actual < low) {
    return { status: 'under', diff: low - actual };
  }
  if (high != null && actual > high) {
    return { status: 'over', diff: actual - high };
  }
  return { status: 'hit' };
}

// Convenience for chip text: "Z3 · 142"
export function chipText(bpm, hrMax = WORKING_HRMAX) {
  const z = zoneOf(bpm, hrMax);
  if (!z) return null;
  return `${z.code} · ${Math.round(bpm)}`;
}
