import styles from './SettingsScreen.module.css';
import common from '../components/Common.module.css';
import { MAXES_CONFIG } from '../data/exercises';
import { DAY_TYPE_INFO } from '../data/sessions';
import { useSettingsStore } from '../stores/settingsStore';

export function SettingsScreen() {
  const maxes      = useSettingsStore((s) => s.maxes);
  const setMax     = useSettingsStore((s) => s.setMax);
  const dayOrder   = useSettingsStore((s) => s.dayOrder);
  const setDayOrder = useSettingsStore((s) => s.setDayOrder);
  const resetDayOrder = useSettingsStore((s) => s.resetDayOrder);
  const timerPrefs   = useSettingsStore((s) => s.timerPrefs);
  const setTimerPref = useSettingsStore((s) => s.setTimerPref);

  const moveDay = (idx, dir) => {
    const next = [...dayOrder];
    const tgt = idx + dir;
    if (tgt < 0 || tgt >= next.length) return;
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    setDayOrder(next);
  };

  return (
    <main className="screen">
      <div className="title-xl" style={{ marginBottom: 4 }}>Settings</div>

      <div className={common.sectionLabel}>Working Maxes</div>
      <div className={styles.maxGrid}>
        {MAXES_CONFIG.map((m) => (
          <div key={m.key} className={styles.maxCard}>
            <div className={styles.maxCardLabel}>{m.label}</div>
            <input
              className={styles.maxInput}
              type="number"
              inputMode="numeric"
              placeholder={m.placeholder}
              value={maxes[m.key] || ''}
              onChange={(e) => setMax(m.key, Number(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>

      <div className={common.sectionLabel}>Session Order</div>
      {dayOrder.map((d, i) => (
        <div key={d} className={styles.dayItem}>
          <div className={styles.dayN}>{i + 1}</div>
          <div className={styles.dayName}>{DAY_TYPE_INFO[d]?.sub ?? d}</div>
          <button type="button" className={styles.dayBtn} onClick={() => moveDay(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
          <button type="button" className={styles.dayBtn} onClick={() => moveDay(i, 1)} disabled={i === dayOrder.length - 1} aria-label="Move down">↓</button>
        </div>
      ))}
      <div className={common.btnRow} style={{ marginBottom: 16 }}>
        <button type="button" className={common.ctaSecondary} onClick={resetDayOrder}>Reset</button>
      </div>

      <div className={common.sectionLabel}>Rest Timer</div>
      <div className={styles.group}>
        <ToggleRow
          label="Auto-start timer"
          sub="Starts when set marked done"
          checked={timerPrefs.autoStart}
          onChange={(v) => setTimerPref('autoStart', v)}
        />
        <ToggleRow
          label="Audible alerts"
          sub="3 beeps at 5 sec, tone at zero"
          checked={timerPrefs.audio}
          onChange={(v) => setTimerPref('audio', v)}
        />
        <ToggleRow
          label="Vibrate"
          sub="Haptic feedback on transitions"
          checked={timerPrefs.vibrate}
          onChange={(v) => setTimerPref('vibrate', v)}
        />
      </div>

      <div className={common.sectionLabel}>Supabase</div>
      <div className={styles.group}>
        <div className={styles.row}>
          <div>
            <div className={styles.rowLabel}>Connection</div>
            <div className={styles.rowSub}>Configured via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at build time.</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className={styles.row}>
      <div>
        <div className={styles.rowLabel}>{label}</div>
        {sub && <div className={styles.rowSub}>{sub}</div>}
      </div>
      <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.track} />
      </label>
    </div>
  );
}
