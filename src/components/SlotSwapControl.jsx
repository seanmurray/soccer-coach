import { useState } from 'react';
import styles from './SlotSwapControl.module.css';
import { EX } from '../data/exercises';
import { poolFor } from '../data/rotation';
import { blockIndex } from '../lib/periodization';
import { useSlotStore } from '../stores/slotStore';

// Manual swap picker for one slot. Shows the slot's whole pool (or lift family)
// as pills plus a custom entry, with a Today / Rest-of-block scope choice. The
// active pick is highlighted. Writes to the slot store; resolveSlot reads it.
export function SlotSwapControl({ homeKey, week, activeKey, isCustom }) {
  const swapToday = useSlotStore((s) => s.swapToday);
  const swapBlock = useSlotStore((s) => s.swapBlock);
  const clearSlot = useSlotStore((s) => s.clearSlot);
  const todayChoice = useSlotStore((s) => s.today[homeKey]);
  const blockEntry = useSlotStore((s) => s.block[homeKey]);

  const curBlock = blockIndex(week);
  const manualActive = !!todayChoice || (blockEntry && blockEntry.block === curBlock);
  const currentScope = (blockEntry && blockEntry.block === curBlock) ? 'block' : 'today';

  const [scope, setScope] = useState(currentScope);
  const [customName, setCustomName] = useState('');

  const pool = poolFor(homeKey);
  const weeksLeft = 5 - ((week - 1) % 5); // incl. current week

  const apply = (choice) => {
    if (scope === 'block') swapBlock(homeKey, choice, curBlock);
    else swapToday(homeKey, choice);
  };

  // Re-apply the CURRENT stored pick at a newly chosen scope (the stored choice
  // carries the real key or custom name — don't reconstruct from the slug).
  const changeScope = (next) => {
    setScope(next);
    const choice = todayChoice ?? blockEntry?.choice ?? null;
    if (!choice) return;
    if (next === 'block') swapBlock(homeKey, choice, curBlock);
    else swapToday(homeKey, choice);
  };

  const submitCustom = () => {
    const n = customName.trim();
    if (!n) return;
    apply({ custom: n });
    setCustomName('');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>Swap this slot</div>

      <div className={styles.scopeRow}>
        <button type="button" className={`${styles.scopeBtn} ${scope === 'today' ? styles.on : ''}`} onClick={() => changeScope('today')}>
          Just today
        </button>
        <button type="button" className={`${styles.scopeBtn} ${scope === 'block' ? styles.on : ''}`} onClick={() => changeScope('block')}>
          Rest of block ({weeksLeft} {weeksLeft === 1 ? 'wk' : 'wks'})
        </button>
      </div>

      <div className={styles.pills}>
        {pool.map((k) => {
          const isActive = !isCustom && k === activeKey;
          const isHome = k === homeKey;
          return (
            <button
              key={k}
              type="button"
              className={`${styles.pill} ${isActive ? styles.active : ''} ${isHome ? styles.home : ''}`}
              onClick={() => (isActive ? clearSlot(homeKey) : apply({ key: k }))}
            >
              {EX[k]?.name ?? k}{isHome ? ' ★' : ''}
            </button>
          );
        })}
      </div>

      <div className={styles.customRow}>
        <input
          className={styles.customInput}
          type="text"
          placeholder="Custom / other exercise…"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitCustom(); }}
        />
        <button type="button" className={styles.customSet} onClick={submitCustom}>Log it</button>
      </div>

      {manualActive && (
        <button type="button" className={styles.reset} onClick={() => clearSlot(homeKey)}>
          ↺ Back to the scheduled exercise
        </button>
      )}
    </div>
  );
}
