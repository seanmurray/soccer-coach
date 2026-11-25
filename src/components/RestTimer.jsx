import { useEffect } from 'react';
import styles from './RestTimer.module.css';
import { useShallow } from 'zustand/react/shallow';
import { useRestTimer } from '../stores/restTimerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { fmtClock } from '../lib/workoutFormat';

// Hold a screen wake lock while a rest timer is on screen so the phone doesn't
// dim/sleep mid-rest and swallow the end sound. Auto-released by the browser
// when the page is hidden (switching apps), so we re-acquire on return. This
// only helps the "phone on the desk, app open" case — a backgrounded PWA can't
// keep the lock or fire audio. Supported on iOS 16.4+ and Android Chrome.
function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch { /* denied / not allowed while hidden — ignore */ }
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}

export function RestTimer() {
  const { visible, exerciseName, total, remaining } = useRestTimer(
    useShallow((s) => ({
      visible: s.visible,
      exerciseName: s.exerciseName,
      total: s.total,
      remaining: s.remaining,
    }))
  );
  const adjust = useRestTimer((s) => s.adjust);
  const skip = useRestTimer((s) => s.skip);
  const keepAwake = useSettingsStore((s) => s.timerPrefs.keepAwake);

  // Default on for existing installs whose persisted prefs predate this flag.
  useWakeLock(visible && keepAwake !== false);

  if (!visible) return null;

  const pct = total > 0 ? remaining / total : 0;

  return (
    <div className={styles.panel} role="status" aria-live="polite">
      <div className={styles.handle} aria-hidden />
      <div className={styles.progress} aria-hidden>
        <div className={styles.progressFill} style={{ width: `${pct * 100}%` }} />
      </div>
      <div className={styles.row}>
        <div className={styles.main}>
          <div className={styles.clock}>{fmtClock(remaining)}</div>
          <div className={styles.label}>Remaining Rest Time</div>
          {exerciseName && <div className={styles.note}>{exerciseName}</div>}
        </div>
        <div className={styles.controls}>
          <button type="button" className={`${styles.btn} ${styles.plus}`} onClick={() => adjust(30)} aria-label="Add 30 seconds">+30</button>
          <button type="button" className={`${styles.btn} ${styles.minus}`} onClick={() => adjust(-30)} aria-label="Subtract 30 seconds">−30</button>
          <button type="button" className={`${styles.btn} ${styles.stop}`} onClick={skip} aria-label="Stop rest timer">■</button>
        </div>
      </div>
    </div>
  );
}
