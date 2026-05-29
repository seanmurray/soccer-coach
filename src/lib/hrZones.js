// HR zone helpers — 5-zone model individualized with the KARVONEN method
// (%heart-rate reserve), anchored to the athlete's calibrated working HRmax
// (185 bpm — see WORKING_HRMAX in sessions.js) and validated resting HR
// (60 bpm — see WORKING_RESTHR).
//
// Why Karvonen (%HRR) over plain %HRmax: %HRmax ignores resting HR and so
// understates effort for a trained athlete with a low RHR. We have a real,
// validated RHR (soccer_biometrics.rhr_bpm ≈ 60), so we use it — the athlete
// explicitly wants personalized models over population formulas.
//   reserve = HRmax − RHR
//   target(%) = RHR + % · reserve
//
// Used by the Recent-workouts card (zone badge + time-in-zone bar), the Today
// HR-prescription banner, the training-load (Foster) model, and the CNS budget.

import { WORKING_HRMAX, WORKING_RESTHR } from '../data/sessions';

// Per-zone metadata (codes, labels, colors) is HR-independent; only the bpm
// break points scale with HRmax/RHR. Colors map to the existing CSS vars used
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

// Build the zone table (bpm break points) for a given HRmax + RHR using
// Karvonen %HRR bands: Z1 <60%, Z2 60-70%, Z3 70-80%, Z4 80-90%, Z5 90-100%.
// Z5 ceiling is HRmax itself; anything above is still Z5. Default args keep
// every existing caller working against the configured working HRmax/RHR;
// pass calibrated values to scale the zones to the athlete's observed max.
export function zonesFor(hrMax = WORKING_HRMAX, restHr = WORKING_RESTHR) {
  const reserve = Math.max(1, hrMax - restHr);
  const t = (pct) => Math.round(restHr + pct * reserve);
  const z1 = t(0.60);
  const z2 = t(0.70);
  const z3 = t(0.80);
  const z4 = t(0.90);
  return {
    Z1: { ...ZONE_META.Z1, low: 0,      high: z1 },
    Z2: { ...ZONE_META.Z2, low: z1 + 1, high: z2 },
    Z3: { ...ZONE_META.Z3, low: z2 + 1, high: z3 },
    Z4: { ...ZONE_META.Z4, low: z3 + 1, high: z4 },
    Z5: { ...ZONE_META.Z5, low: z4 + 1, high: hrMax },
  };
}

// Default zone table at the configured working HRmax/RHR. Kept as a named
// export for back-compat with callers that don't do dynamic calibration.
export const ZONES = zonesFor(WORKING_HRMAX, WORKING_RESTHR);

// Calibrated HRmax from observed workout maxes. The configured WORKING_HRMAX
// (185, a validated estimate) is the FLOOR — we only ever raise it when the
// athlete demonstrably and REPEATABLY exceeds it, never lower it.
//
// Robustness: a single artifact reading (chest-strap dropout, watch glitch)
// must NOT permanently widen every zone. So we require corroboration — the
// calibration candidate is the SECOND-highest plausible reading, not the
// single max. One freak spike is therefore ignored; two independent readings
// near a higher max are needed to move the ceiling. Capped at 195 (a 44yo
// sustaining >195 is almost certainly a sensor artifact, not physiology).
export const HRMAX_CEIL = 195;
export function calibratedHRmax(observedMaxes = []) {
  const plausible = [];
  for (const m of observedMaxes) {
    const n = Number(m);
    if (Number.isFinite(n) && n > 0 && n <= HRMAX_CEIL) plausible.push(n);
  }
  plausible.sort((a, b) => b - a);
  // 2nd-highest as the corroborated candidate; a lone high reading can't raise.
  const candidate = plausible.length >= 2 ? plausible[1] : WORKING_HRMAX;
  return Math.max(WORKING_HRMAX, candidate);
}

// Return the zone object for a given HR reading. Null in → null out so callers
// can decide whether to render the chip at all. Pass hrMax/restHr to score
// against calibrated values instead of the defaults.
export function zoneOf(bpm, hrMax = WORKING_HRMAX, restHr = WORKING_RESTHR) {
  if (bpm == null || !Number.isFinite(bpm) || bpm <= 0) return null;
  const Z = zonesFor(hrMax, restHr);
  if (bpm <= Z.Z1.high) return Z.Z1;
  if (bpm <= Z.Z2.high) return Z.Z2;
  if (bpm <= Z.Z3.high) return Z.Z3;
  if (bpm <= Z.Z4.high) return Z.Z4;
  return Z.Z5;
}

// Sum an integer-bpm histogram ({ "148": seconds, ... }, stored as hr_hist at
// ingest) into seconds-per-zone using the CURRENT calibrated HRmax/RHR. This
// is the single source of zone-time: computing it here (not at ingest) means
// recalibrating HRmax retroactively re-buckets every workout and there is no
// edge/app boundary drift. Returns null when the histogram is empty.
export function zoneSecFromHist(hist, hrMax = WORKING_HRMAX, restHr = WORKING_RESTHR) {
  if (!hist || typeof hist !== 'object') return null;
  const z = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
  let any = false;
  for (const [bpmStr, secVal] of Object.entries(hist)) {
    const bpm = Number(bpmStr);
    const sec = Number(secVal);
    if (!Number.isFinite(bpm) || bpm <= 0 || !Number.isFinite(sec) || sec <= 0) continue;
    const zo = zoneOf(bpm, hrMax, restHr);
    if (zo) { z[zo.code] += sec; any = true; }
  }
  return any ? z : null;
}

// Seconds-in-zone for a workout row. Prefers the raw hr_hist (recomputed live
// against the current HRmax/RHR); falls back to a legacy stored hr_zone_sec
// for rows ingested before hr_hist existed. Returns null when neither exists.
export function zoneSecForWorkout(workout, hrMax = WORKING_HRMAX, restHr = WORKING_RESTHR) {
  if (!workout) return null;
  const fromHist = zoneSecFromHist(workout.hr_hist, hrMax, restHr);
  if (fromHist) return fromHist;
  const zs = workout.hr_zone_sec;
  if (zs && typeof zs === 'object') return zs;
  return null;
}

// Compare an actual avg HR to a prescribed range. Used by the today banner.
//   status: 'hit'    — actual is within [low, high]
//           'under'  — actual is below the low bound (worked too easy)
//           'over'   — actual is above the high bound (worked too hard)
//           'none'   — missing input
// A prescribed range with only an upper bound (e.g. "under ~120 bpm" for
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
export function chipText(bpm, hrMax = WORKING_HRMAX, restHr = WORKING_RESTHR) {
  const z = zoneOf(bpm, hrMax, restHr);
  if (!z) return null;
  return `${z.code} · ${Math.round(bpm)}`;
}
