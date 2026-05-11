import { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';

const HEAVY_STRENGTH_DAYS = new Set(['acc', 'vel', 'lin']);
const STORAGE_KEY = 'last_session_day_type';

// Spec §14: when the user is on a conditioning day AND the previous logged
// session was Acceleration / Max Velocity / Linear Agility (heavy compound
// strength), surface the SBS finding that running-based conditioning
// interferes with strength adaptation. Recommend bike / rower / SkiErg.
//
// localStorage is read once via the lazy initializer — the value reflects the
// previous session and only changes after a new session is saved (which
// triggers a remount via the parent). No effect needed.
export function ConditioningWarning() {
  const dayType = useSessionStore((s) => s.dayType);
  const [lastDay] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  if (dayType !== 'cond' || !lastDay || !HEAVY_STRENGTH_DAYS.has(lastDay)) return null;

  return (
    <div style={{
      background: 'var(--orange-bg)',
      border: '0.5px solid var(--orange-line)',
      borderRadius: 'var(--r3)',
      padding: '14px 16px',
      marginBottom: 16,
      color: '#ffb060',
      fontSize: 15,
      lineHeight: 1.55,
    }}>
      <strong style={{ color: 'var(--orange)', fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
        Strength interference warning
      </strong>
      Last session was {lastDay.toUpperCase()} (heavy compound strength).
      SBS meta-analysis: running-based conditioning creates significant lower
      body strength interference within 24-48 hours. Bias toward assault bike,
      rower, or SkiErg today rather than court sprints or curved treadmill.
    </div>
  );
}
