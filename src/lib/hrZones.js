// HR zone helpers — 5-zone standard (Z1–Z5) anchored to the athlete's
// calibrated working HRmax (185 bpm — see WORKING_HRMAX in sessions.js for
// the derivation: Nes 2013 + user-reported 180 = submaximal data point).
//
// Used by Recent workouts card (zone badge per workout) and the Today
// prescription banner (today's prescribed cond protocol → did the workout's
// avg HR hit it?).

import { WORKING_HRMAX } from '../data/sessions';

// Percent-of-HRmax break points → bpm thresholds, snapped to int. Standard
// 5-zone model used widely in endurance literature (Seiler polarized, ACSM).
// Z5 ceiling is HRmax itself; treat anything above as Z5.
const Z1_MAX = Math.round(WORKING_HRMAX * 0.60); // 111
const Z2_MAX = Math.round(WORKING_HRMAX * 0.70); // 130
const Z3_MAX = Math.round(WORKING_HRMAX * 0.80); // 148
const Z4_MAX = Math.round(WORKING_HRMAX * 0.90); // 167

// Visual + descriptive metadata per zone. Colors map to the existing CSS
// vars used by CNSBudgetCard / ACWRCard so chips look at-home on Today.
//   green = aerobic territory (Z1, Z2) — recovery / base
//   blue  = Z3 — tempo / sweet spot
//   amber = Z4 — threshold (productive but costly)
//   red   = Z5 — VO2max territory (high CNS / cardio cost)
export const ZONES = {
  Z1: { code: 'Z1', label: 'Recovery',    low: 0,          high: Z1_MAX,         color: 'var(--green)' },
  Z2: { code: 'Z2', label: 'Aerobic',     low: Z1_MAX + 1, high: Z2_MAX,         color: 'var(--green)' },
  Z3: { code: 'Z3', label: 'Tempo',       low: Z2_MAX + 1, high: Z3_MAX,         color: 'var(--blue)'  },
  Z4: { code: 'Z4', label: 'Threshold',   low: Z3_MAX + 1, high: Z4_MAX,         color: 'var(--amber)' },
  Z5: { code: 'Z5', label: 'VO2max',      low: Z4_MAX + 1, high: WORKING_HRMAX,  color: 'var(--red)'   },
};

// Return the zone object for a given avg-HR reading. Null in → null out so
// callers can decide whether to render the chip at all.
export function zoneOf(bpm) {
  if (bpm == null || !Number.isFinite(bpm) || bpm <= 0) return null;
  if (bpm <= Z1_MAX) return ZONES.Z1;
  if (bpm <= Z2_MAX) return ZONES.Z2;
  if (bpm <= Z3_MAX) return ZONES.Z3;
  if (bpm <= Z4_MAX) return ZONES.Z4;
  return ZONES.Z5;
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
export function chipText(bpm) {
  const z = zoneOf(bpm);
  if (!z) return null;
  return `${z.code} · ${Math.round(bpm)}`;
}
