import { useEffect, useState } from 'react';
import styles from './ModuleSheet.module.css';
import { MODULES } from '../data/modules';
import { useSessionStore } from '../stores/sessionStore';

// Bottom-sheet for the prehab modules. Open / close are tracked for telemetry
// (spec §9): record opened_at, closed_at, duration, exercises checked.
//
// `moduleIndex` — index into MODULES, or null when the sheet is closed.
export function ModuleSheet({ moduleIndex, onClose }) {
  const open = moduleIndex != null;
  const mod = open ? MODULES[moduleIndex] : null;

  const pushModuleUsage = useSessionStore((s) => s.pushModuleUsage);
  const [checked, setChecked] = useState(() => new Set());
  const [openedAt, setOpenedAt] = useState(null);

  // "Reset on prop change" pattern (React docs: storing info from previous
  // renders). On a fresh open we wipe the checked set and stamp opened_at as
  // state — refs aren't allowed to mutate during render in React 19.
  const [prevIndex, setPrevIndex] = useState(moduleIndex);
  if (prevIndex !== moduleIndex) {
    setPrevIndex(moduleIndex);
    setChecked(new Set());
    setOpenedAt(moduleIndex != null ? new Date() : null);
  }

  // Cap scroll on body while open (mobile rubber-band fix). This is
  // legitimate effect work — synchronizing with an external system (DOM).
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!mod) return null;

  // Total checkable exercises across the sections — used in telemetry payload.
  const totalItems = mod.sections.reduce(
    (sum, s) => sum + (s.kind === 'items' ? s.items.length : 0),
    0
  );

  const close = () => {
    const closedAt = new Date();
    const opened = openedAt;
    if (opened) {
      const seconds = Math.round((closedAt - opened) / 1000);
      pushModuleUsage({
        module_id: mod.id,
        module_label: mod.label,
        opened_at: opened.toISOString(),
        closed_at: closedAt.toISOString(),
        duration_seconds: seconds,
        exercises_done: [...checked],
        exercises_total: totalItems,
      });
    }
    onClose();
  };

  // Helper: a stable key per item (section index + item index) for the
  // checked-set tracking.
  const itemKey = (sectionIdx, itemIdx) => `${sectionIdx}.${itemIdx}`;
  const toggleItem = (key) => setChecked((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.open : ''}`}
        onClick={close}
        aria-hidden
      />
      <div className={`${styles.sheet} ${open ? styles.open : ''}`} role="dialog" aria-modal="true" aria-label={mod.label}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{mod.label}</div>
            <div className={styles.sub}>{mod.sub}</div>
          </div>
          <button type="button" className={styles.close} onClick={close} aria-label="Close">✕</button>
        </div>
        <div className={styles.body}>
          {mod.sections.map((section, si) => {
            if (section.kind === 'info') {
              return <div key={si} className={styles.info}>{section.body}</div>;
            }
            if (section.kind === 'warn') {
              return <div key={si} className={styles.warn}>{section.body}</div>;
            }
            if (section.kind === 'phase') {
              return (
                <div key={si} className={styles.phase}>
                  <div className={styles.phaseTitle}>{section.title}</div>
                  <div className={styles.phaseDesc}>{section.body}</div>
                </div>
              );
            }
            // section.kind === 'items'
            return (
              <div key={si} className={styles.section}>
                {section.title && <div className={styles.sectionTitle}>{section.title}</div>}
                {section.items.map((it, ii) => {
                  const key = itemKey(si, ii);
                  return (
                    <label key={ii} className={styles.item}>
                      <input
                        type="checkbox"
                        className={styles.cb}
                        checked={checked.has(key)}
                        onChange={() => toggleItem(key)}
                      />
                      <div className={styles.itemBody}>
                        <div className={styles.itemName}>{it.name}</div>
                        {it.rx && <div className={styles.itemRx}>{it.rx}</div>}
                        {it.cue && <div className={styles.itemCue}>{it.cue}</div>}
                        {it.url && (
                          <a href={it.url} target="_blank" rel="noreferrer" className={styles.video}>▸ Watch</a>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
