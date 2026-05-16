import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';

// Same "high-CNS day" set the strength-interference banner uses: acceleration,
// max-velocity, and linear-agility days are the max-intent / heavy-compound /
// PAP-contrast days that draw hardest on the CNS. lat is moderate; cond varies
// by protocol so it's excluded here.
const HIGH_CNS_DAYS = new Set(['acc', 'vel', 'lin']);
const STORAGE_KEY = 'last_session_day_type';

const LABEL = { acc: 'Acceleration', vel: 'Max Velocity', lin: 'Linear Agility' };

// Masters recovery spacing: 40+ athletes adapt better on a
// hard/easy/easy/hard pattern than the classic hard/easy — the CNS recovers
// slower than the muscles do. When today is a high-CNS day AND the last
// logged session was also high-CNS, two quality days are stacking
// back-to-back. Advisory only (doesn't change the prescription) — same
// read-once-from-localStorage mechanism as ConditioningWarning.
export function MastersSpacingWarning() {
  const dayType = useSessionStore((s) => s.dayType);
  const [lastDay] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  if (!HIGH_CNS_DAYS.has(dayType) || !lastDay || !HIGH_CNS_DAYS.has(lastDay)) {
    return null;
  }

  return (
    <div style={{
      background: 'var(--amber-bg)',
      border: '0.5px solid var(--amber-line)',
      borderRadius: 'var(--r3)',
      padding: '14px 16px',
      marginBottom: 16,
      color: 'var(--amber)',
      fontSize: 15,
      lineHeight: 1.55,
    }}>
      <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
        Back-to-back CNS-heavy days
      </strong>
      Last session was {LABEL[lastDay] ?? lastDay.toUpperCase()} and today is{' '}
      {LABEL[dayType] ?? dayType.toUpperCase()} — two high-CNS days in a row.
      At 44 the evidence favors hard/easy/easy/hard over hard/easy: the CNS
      recovers slower than the muscles, so stacked quality days blunt the
      adaptation and raise soft-tissue risk. Consider slotting a lateral,
      conditioning, or recovery day between these two, or capping intent today.
    </div>
  );
}
