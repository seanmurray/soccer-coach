import styles from './PhaseContextBanner.module.css';
import { getPhase, getPhaseLabel } from '../lib/periodization';
import { useSessionStore } from '../stores/sessionStore';

const PHASE_DESCRIPTIONS = {
  accumulation:  'Eccentric block. Long lower phase, short pause, explosive concentric. Bypasses GTO inhibition and builds tendon elasticity. Volume over intensity.',
  transmutation: 'Isometric block. Long pause at the sticking point. Trains force production from a dead stop — strength under tension at the hardest joint angles.',
  realization:   'Concentric block — contrast method. Heavy strength set immediately followed by a max-effort jump. The heavy load potentiates the CNS for the explosive movement.',
  deload:        '50% deload week. Movement quality only. Your body needs the recovery to absorb the previous 8 weeks of accumulated stress.',
};

export function PhaseContextBanner() {
  const week = useSessionStore((s) => s.week);
  const phase = getPhase(week);
  const label = getPhaseLabel(week);
  const desc = PHASE_DESCRIPTIONS[phase];

  return (
    <div className={styles.box}>
      <div className={styles.title}>Week {week} · {label}</div>
      <div className={styles.text}>{desc}</div>
    </div>
  );
}
