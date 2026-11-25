import { useState } from 'react';
import styles from './flow.module.css';
import { FlowHeader } from './FlowHeader';
import { FullSheet, PillButton } from '../../components/ui/FullSheet';
import { useSessionStore } from '../../stores/sessionStore';
import { WARMUP, WARMUP_OTA_URL, FRC_SHORT } from '../../data/frc';
import { DAY_TYPE_INFO } from '../../data/sessions';

// Step 1 after Start Workout: the OTA dynamic warm-up and the FRC
// pre-session block as check-off cards. Same store fields as before
// (warmupChecked / frcShortChecked) so the saved metadata is unchanged.
export function WarmupStep({ onBack }) {
  const dayType = useSessionStore((s) => s.dayType);
  const week = useSessionStore((s) => s.week);
  const warmupChecked = useSessionStore((s) => s.warmupChecked);
  const setWarmupChecked = useSessionStore((s) => s.setWarmupChecked);
  const frcChecked = useSessionStore((s) => s.frcShortChecked);
  const setFrcChecked = useSessionStore((s) => s.setFrcChecked);
  const setStage = useSessionStore((s) => s.setStage);
  const [info, setInfo] = useState(null);

  const allOta = warmupChecked.length === WARMUP.length;
  const toggleAll = () => WARMUP.forEach((_, i) => setWarmupChecked(i, !allOta));

  return (
    <main className="screen">
      <FlowHeader onBack={onBack} title={DAY_TYPE_INFO[dayType]?.sub} sub={`Week ${week} · Warm-up`} />
      <div className="title-xl">Warm-up</div>
      <p className={styles.lede}>
        Get moving before you check in — answering the readiness questions
        after you&apos;re warm gives a truer read on how you actually feel.
      </p>

      <div className={styles.sectionHead}>
        <div className="overline">OTA dynamic warm-up</div>
        <button type="button" className={styles.linkBtn} onClick={toggleAll}>
          {allOta ? 'Uncheck all' : 'Check all'}
        </button>
      </div>
      <a href={WARMUP_OTA_URL} target="_blank" rel="noreferrer" className={styles.watch}>▸ Watch the routine</a>
      {WARMUP.map((text, i) => {
        const on = warmupChecked.includes(i);
        const [name, rx] = text.split(' — ');
        return (
          <button key={i} type="button" className={`${styles.checkCard} ${on ? styles.checkOn : ''}`} onClick={() => setWarmupChecked(i, !on)} aria-pressed={on}>
            <span className={styles.checkText}>
              <span className={styles.exName}>{name}</span>
              {rx && <span className={styles.exTarget}>{rx}</span>}
            </span>
            <span className={styles.checkBox} aria-hidden>{on ? '✓' : ''}</span>
          </button>
        );
      })}

      <div className={styles.sectionHead} style={{ marginTop: 22 }}>
        <div className="overline">FRC joint prep · ~8 min</div>
      </div>
      {FRC_SHORT.map((it, i) => {
        const on = frcChecked.includes(i);
        const [name, rx] = it.text.split(' — ');
        return (
          <div key={i} className={`${styles.checkCard} ${on ? styles.checkOn : ''}`}>
            <span className={styles.checkText}>
              <span className={styles.exName}>{name}</span>
              {rx && <span className={styles.exTarget}>{rx}</span>}
            </span>
            {(it.cue || it.url) && (
              <button type="button" className={styles.rowIcon} onClick={() => setInfo(it)} aria-label={`About ${name}`}>
                <span className={`${styles.infoGlyph} ${styles.infoAccent}`}>i</span>
              </button>
            )}
            <button type="button" className={styles.checkBox} onClick={() => setFrcChecked('short', i, !on)} aria-pressed={on} aria-label={`Done: ${name}`}>
              {on ? '✓' : ''}
            </button>
          </div>
        );
      })}

      <div className={styles.ctaSpacer} />
      <div className={styles.ctaDock}>
        <PillButton onClick={() => setStage('readiness')}>Next</PillButton>
      </div>

      <FullSheet open={!!info} title={info?.text.split(' — ')[0]} onClose={() => setInfo(null)}>
        {info?.badge && <div className={styles.badge}>{info.badge}</div>}
        {info?.cue && <p className={styles.sheetCue}>{info.cue}</p>}
        {info?.url && <a href={info.url} target="_blank" rel="noreferrer" className={styles.watch}>▸ Watch demo</a>}
      </FullSheet>
    </main>
  );
}
