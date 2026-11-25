import { useState } from 'react';
import styles from './ExerciseBlock.module.css';
import uiStyles from './ui/ui.module.css';
import { FullSheet } from './ui/FullSheet';
import { ExerciseNote } from './ExerciseNote';
import { ExerciseHistoryInline } from './ExerciseHistoryInline';
import { summarizeSets } from '../lib/workoutFormat';
import { Icon } from './ui/Icon';
import { useExerciseHistory } from '../hooks/useExerciseHistory';

// One exercise card in the workout: name + ⓘ / ⇄ icons, the prescription
// line, a "Last time" memory line, then the logging rows (children). A
// vertical bar down the left edge is blue while in progress and turns green
// once every set is logged (`complete`).
//
// Everything that used to crowd the card — coaching cue, demo link, tempo
// explanation, contrast cue, form-cue note, upgrade toggle, recent history,
// per-exercise log settings — lives in the ⓘ sheet. The swap picker lives
// in the ⇄ sheet (`swapContent`).
export function ExerciseBlock({
  name,
  badge,          // optional { text, tone } — rotation/swap indicator under name
  exerciseKey,    // enables the form-cue note + history in the ⓘ sheet
  target,         // e.g. "4 sets × 5 reps"
  load,           // e.g. "57% · 230 lb"
  tempo,          // e.g. "[5|1|X]"
  tempoText,      // plain-words tempo explanation
  note,           // phase/week note
  cue,
  url,
  contrast,       // realization-phase contrast cue
  originalName,   // canonical name for the form-cue note when swapped/upgraded
  upgrade = null, // optional { name, desc, prereq, url } variant
  upgradeActive = false,
  onToggleUpgrade,
  historyKind = 'sets', // 'sets' | 'feedback' | null (no history)
  swapContent,    // ReactNode for the ⇄ sheet; omit to hide the icon
  settingsContent,// ReactNode for the ⓘ sheet's Settings section
  warmup,         // ReactNode row rendered above the sets (warm-up ramp)
  complete = false,
  children,
}) {
  const [sheet, setSheet] = useState(null); // 'info' | 'swap' | null

  return (
    <section className={`${styles.card} ${complete ? styles.complete : ''}`}>
      <div className={styles.bar} aria-hidden />
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.titleCol}>
            <h3 className={styles.name}>{name}</h3>
            {badge && <span className={`${styles.badge} ${styles[`badge_${badge.tone}`] ?? ''}`}>{badge.text}</span>}
          </div>
          <div className={styles.icons}>
            <button type="button" className={styles.icon} onClick={() => setSheet('info')} aria-label={`About ${name}`}>
              <span className={styles.infoGlyph}>i</span>
            </button>
            {swapContent && (
              <button type="button" className={styles.icon} onClick={() => setSheet('swap')} aria-label={`Swap ${name}`}>
                <Icon name="swap" />
              </button>
            )}
          </div>
        </div>

        {(target || load || tempo) && (
          <div className={styles.rx}>
            {target && <span>{target}</span>}
            {load && <span className={styles.load}>{load}</span>}
            {tempo && <span className={styles.tempo}>{tempo}</span>}
          </div>
        )}

        {exerciseKey && historyKind === 'sets' && <LastTime exerciseKey={exerciseKey} />}

        {warmup}

        <div className={styles.body}>{children}</div>
      </div>

      <FullSheet open={sheet === 'info'} title={name} onClose={() => setSheet(null)}>
        {cue && <p className={styles.cue}>{cue}</p>}
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className={styles.watch}>▸ Watch demo</a>
        )}
        {(tempoText || note) && (
          <div className={uiStyles.card}>
            {tempo && <div className={uiStyles.cardLabel}>Tempo {tempo}</div>}
            {tempoText && <p className={styles.sheetText}>{tempoText}</p>}
            {note && <p className={styles.sheetText}>{note}</p>}
          </div>
        )}
        {contrast && (
          <div className={`${uiStyles.card} ${styles.contrast}`}>
            <strong>Contrast set:</strong> {contrast}
          </div>
        )}
        {exerciseKey && <ExerciseNote exerciseKey={exerciseKey} exerciseName={originalName ?? name} />}
        {upgrade && onToggleUpgrade && (
          <div className={uiStyles.card}>
            <div className={uiStyles.cardHead}>
              <div className={uiStyles.cardLabel}>Upgrade: {upgrade.name}</div>
              <button
                type="button"
                className={`${styles.upgradeBtn} ${upgradeActive ? styles.upgradeOn : ''}`}
                onClick={onToggleUpgrade}
                aria-pressed={upgradeActive}
              >
                {upgradeActive ? 'Using it' : 'Try it'}
              </button>
            </div>
            <p className={styles.sheetText}>{upgrade.desc}</p>
            {upgrade.prereq && <p className={styles.sheetMuted}>Prereq: {upgrade.prereq}</p>}
          </div>
        )}
        {exerciseKey && historyKind && (
          <ExerciseHistoryInline exerciseKey={exerciseKey} kind={historyKind} />
        )}
        {settingsContent && (
          <>
            <div className={`overline ${styles.sheetSection}`}>Settings</div>
            {settingsContent}
          </>
        )}
      </FullSheet>

      {swapContent && (
        <FullSheet open={sheet === 'swap'} title="Swap Exercise" onClose={() => setSheet(null)}>
          {swapContent}
        </FullSheet>
      )}
    </section>
  );
}

// "Last time: 4×5 · @ 225 lbs · RPE 8" — the most recent past session for
// this exercise, right on the card so you don't have to remember it.
function LastTime({ exerciseKey }) {
  const { data } = useExerciseHistory(exerciseKey, 'sets');
  const last = data?.[0];
  if (!last) return null;
  return (
    <div className={styles.lastTime}>
      <span className={styles.lastLabel}>Last time</span> {summarizeSets(last.sets)}
    </div>
  );
}
