import styles from './SettingsScreen.module.css';
import common from '../components/Common.module.css';
import { NumField } from '../components/NumField';
import { TimerSoundRecorder } from '../components/TimerSoundRecorder';
import { MAXES_CONFIG } from '../data/exercises';
import { DAY_TYPE_INFO } from '../data/sessions';
import { useSettingsStore } from '../stores/settingsStore';

const SEASONS = [
  { key: 'off',     label: 'Off' },
  { key: 'pre',     label: 'Pre' },
  { key: 'in',      label: 'In' },
  { key: 'playoff', label: 'Playoff' },
];

// Strength volume only — intensity (load) is preserved across all phases,
// per the maintenance principle (cut volume, not load, in-season).
const SEASON_HINT = {
  off: 'Off-season — full build volume. The window to add strength.',
  pre: 'Pre-season — program as authored (baseline volume).',
  in:  'In-season — strength sets cut ~40%, load preserved. Maintains strength while leaving CNS headroom for matches.',
  playoff: 'Playoff — minimal maintenance dose (sets ~halved), load preserved. Stay fresh.',
};

export function SettingsScreen() {
  const maxes      = useSettingsStore((s) => s.maxes);
  const setMax     = useSettingsStore((s) => s.setMax);
  const dayOrder   = useSettingsStore((s) => s.dayOrder);
  const setDayOrder = useSettingsStore((s) => s.setDayOrder);
  const resetDayOrder = useSettingsStore((s) => s.resetDayOrder);
  const timerPrefs   = useSettingsStore((s) => s.timerPrefs);
  const setTimerPref = useSettingsStore((s) => s.setTimerPref);
  const season       = useSettingsStore((s) => s.season);
  const setSeason    = useSettingsStore((s) => s.setSeason);

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
            <NumField
              className={styles.maxInput}
              placeholder={m.placeholder}
              value={maxes[m.key] || null}
              onChange={(n) => setMax(m.key, n ?? 0)}
              aria-label={m.label}
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

      <div className={common.sectionLabel}>Season</div>
      <div className={styles.segmented}>
        {SEASONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`${styles.segment} ${season === s.key ? styles.active : ''}`}
            onClick={() => setSeason(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className={styles.seasonHint}>{SEASON_HINT[season] ?? ''}</div>

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
        <ToggleRow
          label="Keep screen on during rest"
          sub="Stops the phone sleeping mid-timer so the sound plays"
          checked={timerPrefs.keepAwake !== false}
          onChange={(v) => setTimerPref('keepAwake', v)}
        />
        <TimerSoundRecorder />
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
