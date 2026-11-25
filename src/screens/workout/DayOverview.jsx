import { useState } from 'react';
import styles from './flow.module.css';
import { FullSheet, PillButton } from '../../components/ui/FullSheet';
import { SlotSwapControl } from '../../components/SlotSwapControl';
import { MastersSpacingWarning } from '../../components/MastersSpacingWarning';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSlotStore } from '../../stores/slotStore';
import { DAY_TYPE_INFO, MODE_DATA } from '../../data/sessions';
import { getPhaseLabel } from '../../lib/periodization';
import { Icon } from '../../components/ui/Icon';
import { dayPlan } from './dayPlan';

// Workout tab, before you start: the day title, a Week · Day stepper, and
// the day's exercises grouped by block — each with ⓘ (cue) and, for
// strength/build slots, ⇄ (swap). Skip moves to the next day; Start Workout
// begins the session (→ warm-up). If a session is already running, the
// button resumes it instead.
export function DayOverview({ onStart }) {
  const dayType = useSessionStore((s) => s.dayType);
  const setDayType = useSessionStore((s) => s.setDayType);
  const week = useSessionStore((s) => s.week);
  const setWeek = useSessionStore((s) => s.setWeek);
  const mode = useSessionStore((s) => s.mode);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const setStage = useSessionStore((s) => s.setStage);
  const dayOrder = useSettingsStore((s) => s.dayOrder);
  const season = useSettingsStore((s) => s.season);
  const today = useSlotStore((s) => s.today);
  const block = useSlotStore((s) => s.block);

  const [sheet, setSheet] = useState(null); // { kind: 'info'|'swap', item }

  const idx = Math.max(0, dayOrder.indexOf(dayType));
  const n = dayOrder.length;
  const step = (dir) => {
    let i = idx + dir;
    let w = week;
    if (i >= n) { i = 0; w = week + 1; }
    if (i < 0) {
      if (week <= 1) return;
      i = n - 1; w = week - 1;
    }
    if (w !== week) setWeek(w);
    setDayType(dayOrder[i]);
  };

  const sections = dayPlan({ dayType, mode, week, season, today, block });
  const inSession = !!sessionStartedAt;
  // Re-resolve the swap sheet's slot from live data so the active pick
  // highlights correctly right after you change it.
  const swapItem = sheet?.kind === 'swap'
    ? sections.flatMap((x) => x.items).find((i) => i.homeKey === sheet.item.homeKey) ?? sheet.item
    : null;

  return (
    <main className="screen">
      <div className="title-xl">{DAY_TYPE_INFO[dayType]?.sub ?? 'Workout'}</div>
      <div className={styles.sub}>{getPhaseLabel(week)} · {MODE_DATA[mode]?.label}</div>

      <div className={styles.dayStepper}>
        <button type="button" className={styles.stepBtn} onClick={() => step(-1)} disabled={inSession || (week <= 1 && idx === 0)} aria-label="Previous day">‹</button>
        <div className={styles.stepText}>
          <div className={styles.stepWeek}>Week {week}</div>
          <div className={styles.stepDay}>Day {idx + 1} of {n}</div>
        </div>
        <button type="button" className={styles.stepBtn} onClick={() => step(1)} disabled={inSession} aria-label="Next day">›</button>
      </div>

      <MastersSpacingWarning />

      <div className={styles.sectionHead}>
        <h2 className={styles.h2}>Overview</h2>
        <span className={styles.hint}>Check-in after warm-up can lighten this</span>
      </div>

      {sections.map((sec) => (
        <section key={sec.id} className={styles.group}>
          <div className={`overline ${styles.groupLabel}`}>{sec.label}</div>
          {sec.items.map((it) => (
            <div key={it.id} className={styles.exRow}>
              <div className={styles.exText}>
                <div className={styles.exName}>{it.name}</div>
                {it.target && <div className={styles.exTarget}>{it.target}</div>}
              </div>
              {it.homeKey && (
                <button type="button" className={styles.rowIcon} onClick={() => setSheet({ kind: 'swap', item: it })} aria-label={`Swap ${it.name}`}><Icon name="swap" /></button>
              )}
              {(it.cue || it.url) && (
                <button type="button" className={styles.rowIcon} onClick={() => setSheet({ kind: 'info', item: it })} aria-label={`About ${it.name}`}>
                  <span className={styles.infoGlyph}>i</span>
                </button>
              )}
            </div>
          ))}
        </section>
      ))}

      <div className={styles.ctaSpacer} />
      <div className={styles.ctaDock}>
        {inSession ? (
          <PillButton variant="accent" onClick={() => setStage('active')}>▷ Resume Workout</PillButton>
        ) : (
          <div className={styles.ctaRow}>
            <button type="button" className={styles.skipBtn} onClick={() => step(1)}>Skip</button>
            <PillButton variant="accent" onClick={onStart}>▷ Start Workout</PillButton>
          </div>
        )}
      </div>

      <FullSheet open={sheet?.kind === 'info'} title={sheet?.item?.name} onClose={() => setSheet(null)}>
        {sheet?.item?.cue && <p className={styles.sheetCue}>{sheet.item.cue}</p>}
        {sheet?.item?.url && (
          <a href={sheet.item.url} target="_blank" rel="noreferrer" className={styles.watch}>▸ Watch demo</a>
        )}
      </FullSheet>
      <FullSheet open={sheet?.kind === 'swap'} title="Swap Exercise" onClose={() => setSheet(null)}>
        {swapItem && (
          <SlotSwapControl
            homeKey={swapItem.homeKey}
            week={week}
            activeKey={swapItem.activeKey}
            isCustom={swapItem.isCustom}
          />
        )}
      </FullSheet>
    </main>
  );
}
