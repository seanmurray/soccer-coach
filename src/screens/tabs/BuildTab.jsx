import { BuildSlot } from '../../components/BuildSlot';
import { useSessionStore } from '../../stores/sessionStore';
import { buildHomesFor } from '../../data/rotation';

export function BuildTab() {
  const dayType = useSessionStore((s) => s.dayType);
  const mode = useSessionStore((s) => s.mode);
  const week = useSessionStore((s) => s.week);

  // Build homes come from the centralized upper/lower plan, trimmed by mode.
  const homes = buildHomesFor(dayType, mode);

  if (homes.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--t2)', fontSize: 17, lineHeight: 1.6 }}>
        No accessory work for this mode.
      </div>
    );
  }

  return homes.map((homeKey) => <BuildSlot key={homeKey} homeKey={homeKey} week={week} />);
}
