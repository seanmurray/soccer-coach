import sheetStyles from './CNSBudgetCard.module.css';
import { useSessionStore } from '../stores/sessionStore';
import { useRecentWorkouts } from '../hooks/useRecentWorkouts';
import { SESSIONS } from '../data/sessions';
import { zoneOf, compareToPrescription } from '../lib/hrZones';

// HR Prescription Banner — sits on Today when there's an HR story to tell:
//   • If today is a conditioning day, surface the prescribed HR range(s) so
//     the athlete knows the target before they walk out the door.
//   • If a workout has been logged today (Apple Health → push-workout), show
//     its avg HR and stack it against the prescribed range — hit, under,
//     over. Goal: "confirm prescribed HR ranges are being met."
//
// Hidden entirely when there's nothing useful to say (no cond prescription
// for today AND no logged workout). Keeps Today quiet on non-cond days when
// no extra cardio has been done.

// Today as YYYY-MM-DD in the local time zone — must match how the edge
// function stores `performed_at` (it derives the local date from
// started_at). Avoids stale UTC mismatches around midnight.
function todayLocalISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Pick the prescribed cond protocols that have an HR range. Many protocols
// in sessions.js are RPE-prescribed (sprint intervals, RSA, etc.) — those
// don't have a meaningful HR target so we exclude them from the banner.
function todayHrProtocols(mode, dayType) {
  if (dayType !== 'cond') return [];
  const protocols = SESSIONS[mode]?.cond?.protocols ?? [];
  return protocols.filter((p) => p.hr_low != null || p.hr_high != null);
}

// Pretty-print a prescribed HR range. Recovery protocols only have an upper
// bound ("under 115 bpm") — render those without a lower number.
function fmtRange(low, high) {
  if (low == null && high != null) return `under ${high} bpm`;
  if (low != null && high == null) return `over ${low} bpm`;
  return `${low}-${high} bpm`;
}

// Find the best-matching prescription for an actual workout HR. If the
// avg HR falls inside any prescribed range, that's the match — the athlete
// hit one of today's options. Otherwise return the closest prescription so
// we can tell them how far off they were.
function matchPrescription(avgHr, protocols) {
  if (avgHr == null || protocols.length === 0) return null;
  for (const p of protocols) {
    const cmp = compareToPrescription(avgHr, p.hr_low, p.hr_high);
    if (cmp.status === 'hit') return { protocol: p, ...cmp };
  }
  // Nothing was a clean hit — pick the prescription with the smallest gap.
  let best = null;
  for (const p of protocols) {
    const cmp = compareToPrescription(avgHr, p.hr_low, p.hr_high);
    if (cmp.status === 'none') continue;
    if (best == null || cmp.diff < best.diff) best = { protocol: p, ...cmp };
  }
  return best;
}

export function HrPrescriptionBanner() {
  const mode = useSessionStore((s) => s.mode);
  const dayType = useSessionStore((s) => s.dayType);
  const { data: workouts } = useRecentWorkouts(5);

  const protocols = todayHrProtocols(mode, dayType);
  const today = todayLocalISO();
  const todaysWorkout = (workouts ?? [])
    .filter((w) => w.performed_at === today && w.avg_hr)
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))[0];

  // No prescription AND no logged workout → render nothing.
  if (protocols.length === 0 && !todaysWorkout) return null;

  const match = todaysWorkout
    ? matchPrescription(todaysWorkout.avg_hr, protocols)
    : null;
  const zone = todaysWorkout ? zoneOf(todaysWorkout.avg_hr) : null;

  // Zone-coloring on the card border follows the same convention as
  // CNSBudgetCard / ACWRCard — green=on target, blue=close, amber=off,
  // red=way off / max effort recorded.
  let cardClass = sheetStyles.card;
  let statusText = null;
  if (todaysWorkout && match) {
    if (match.status === 'hit') {
      cardClass += ' ' + sheetStyles.zoneGreen;
      statusText = `On target — ${match.protocol.name}`;
    } else if (match.status === 'under') {
      cardClass += ' ' + sheetStyles.zoneAmber;
      statusText = `${Math.round(match.diff)} bpm under target (${match.protocol.name})`;
    } else if (match.status === 'over') {
      cardClass += ' ' + sheetStyles.zoneAmber;
      statusText = `${Math.round(match.diff)} bpm over target (${match.protocol.name})`;
    }
  } else if (todaysWorkout && zone) {
    cardClass += ' ' + sheetStyles.zoneOkay;
    statusText = `${zone.label} (off-prescription)`;
  }

  return (
    <div className={cardClass}>
      <div className={sheetStyles.head}>
        <div className={sheetStyles.label}>HR Prescription</div>
        {zone && (
          <div className={sheetStyles.zoneLabel} style={{ color: zone.color }}>
            {zone.code}
          </div>
        )}
      </div>

      {todaysWorkout ? (
        <>
          <div className={sheetStyles.total} style={zone ? { color: zone.color } : undefined}>
            {todaysWorkout.avg_hr} bpm
            {todaysWorkout.max_hr ? (
              <span style={{ fontSize: 14, color: 'var(--t3)', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
                max {todaysWorkout.max_hr}
              </span>
            ) : null}
          </div>
          {statusText && <div className={sheetStyles.text}>{statusText}</div>}
        </>
      ) : (
        <div className={sheetStyles.text}>
          No workout logged today. Get one in to confirm you're hitting the prescribed range.
        </div>
      )}

      {protocols.length > 0 && (
        <div className={sheetStyles.breakdown} style={{ flexDirection: 'column', gap: 4 }}>
          {protocols.map((p, i) => (
            <span key={p.exercise_key ?? p.name ?? i}>
              <strong>{p.name}</strong> · {fmtRange(p.hr_low, p.hr_high)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
