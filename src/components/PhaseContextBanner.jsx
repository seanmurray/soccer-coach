import styles from './PhaseContextBanner.module.css';
import { getPhaseInfo } from '../lib/periodization';
import { useSessionStore } from '../stores/sessionStore';

// Per-week context — combines block description + this-week's role in the
// step-loading microcycle. So the user knows whether to be aggressive (W3
// peak) or pull back (W4 back-off) on the work they're about to do.
const PHASE_DESCRIPTIONS = {
  accumulation:  'Eccentric block. Long lower phase, brief pause, explosive concentric. Bypasses GTO inhibition and builds tendon elasticity. Volume over intensity.',
  transmutation: 'Isometric block. Long pause at the sticking point. Trains force production from a dead stop — strength under tension at the hardest joint angles.',
  realization:   'Concentric block — contrast method. Heavy strength set immediately followed by a max-effort jump. The heavy load potentiates the CNS for the explosive movement.',
  deload:        '50% deload week. Movement quality only. Your body needs the recovery to absorb the previous block.',
};

const STEP_DESCRIPTIONS = {
  1: 'Intro load — dial in technique. Build a base for the rest of the block.',
  2: 'Base load — the working week.',
  3: 'Peak intensity. Drive output, target RPE 8.5.',
  4: 'Back-off week. Lighter loads, full intent. Sets you up to absorb the deload that follows.',
};

export function PhaseContextBanner() {
  const week = useSessionStore((s) => s.week);
  const info = getPhaseInfo(week);

  const desc = PHASE_DESCRIPTIONS[info.phase];
  const step = info.isDeload ? null : STEP_DESCRIPTIONS[info.weekInPhase];

  return (
    <div className={styles.box}>
      <div className={styles.title}>Week {week} · {info.label}</div>
      <div className={styles.text}>{desc}</div>
      {step && <div className={styles.subtext}>{step}</div>}
    </div>
  );
}
