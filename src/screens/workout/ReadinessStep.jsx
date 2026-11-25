import styles from './flow.module.css';
import uiStyles from '../../components/ui/ui.module.css';
import { FlowHeader } from './FlowHeader';
import { Stepper } from '../../components/ui/Stepper';
import { BarScale } from '../../components/ui/BarScale';
import { PillButton, YesNo } from '../../components/ui/FullSheet';
import { ModeBanner } from '../../components/ModeBanner';
import { useSessionStore } from '../../stores/sessionStore';
import { DAY_TYPE_INFO } from '../../data/sessions';
import { BODY_FEEL, MOTIVATION, FOCUS_OPTIONS } from '../../data/checkin';

const ATHLYTIC = [
  { key: 'rec',     label: 'Recovery (Athlytic)', unit: '%' },
  { key: 'battery', label: 'Battery (Athlytic)',  unit: '%' },
  { key: 'stress',  label: 'Stress (Athlytic)',   unit: '' },
];

// Step 2: readiness check-in. Same five inputs the Today sliders used to
// set (so computeMode and everything downstream is unchanged), shown as
// question cards: Athlytic numbers as big steppers with a "No data" toggle,
// body feel + motivation as growing-bar scales. Plus two extras saved to
// session metadata: today's focus and injury-rehab. The resulting training
// mode shows live at the bottom before you start.
export function ReadinessStep({ onBack }) {
  const s = useSessionStore();
  const { dayType, week, mode, checkin, setCheckin, setReadiness, toggleReadinessExclude, setStage } = s;

  return (
    <main className="screen">
      <FlowHeader onBack={onBack} title={DAY_TYPE_INFO[dayType]?.sub} sub={`Week ${week} · Check-in`} />
      <div className="title-xl">Check-in</div>
      <p className={styles.lede}>How are you coming into today? This sets how hard the session runs.</p>

      {ATHLYTIC.map((row) => {
        const v = s[row.key];
        const excluded = v == null;
        return (
          <Stepper
            key={row.key}
            label={row.label}
            value={v}
            onChange={(val) => { if (val != null) setReadiness(row.key, val); }}
            min={0}
            max={100}
            unit={row.unit}
            disabled={excluded}
            headerRight={
              <button
                type="button"
                className={`${styles.chip} ${excluded ? styles.chipOn : ''}`}
                onClick={() => toggleReadinessExclude(row.key)}
                aria-pressed={excluded}
              >
                {excluded ? 'No data ✓' : 'No data'}
              </button>
            }
          />
        );
      })}

      <BarScale
        question="How does your body feel?"
        options={BODY_FEEL}
        value={s.body}
        onChange={(v) => setReadiness('body', v)}
        lowLabel="Wrecked"
        highLabel="Great"
      />
      <BarScale
        question="How motivated are you to train?"
        options={MOTIVATION}
        value={s.mot}
        onChange={(v) => setReadiness('mot', v)}
        lowLabel="Drained"
        highLabel="Fired up"
      />

      <div className={uiStyles.card}>
        <div className={uiStyles.question}>What are you looking to achieve today?</div>
        <div className={uiStyles.choices}>
          {FOCUS_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`${uiStyles.choice} ${checkin.focus === o.id ? uiStyles.choiceOn : ''}`}
              onClick={() => setCheckin({ focus: checkin.focus === o.id ? null : o.id })}
              aria-pressed={checkin.focus === o.id}
            >
              {o.label}
            </button>
          ))}
          <button
            type="button"
            className={`${uiStyles.choice} ${checkin.focus === 'custom' ? uiStyles.choiceOn : ''}`}
            onClick={() => setCheckin({ focus: checkin.focus === 'custom' ? null : 'custom' })}
            aria-pressed={checkin.focus === 'custom'}
          >
            Custom
          </button>
          {checkin.focus === 'custom' && (
            <input
              className={styles.textInput}
              placeholder="Today I am going to…"
              value={checkin.focusCustom}
              onChange={(e) => setCheckin({ focusCustom: e.target.value })}
              aria-label="Custom focus"
            />
          )}
        </div>
      </div>

      <YesNo
        question="Working around an injury today?"
        value={checkin.injuryRehab}
        onChange={(v) => setCheckin({ injuryRehab: v })}
        noFirst
      />

      <div className={`overline ${styles.groupLabel}`}>Today&apos;s training</div>
      <ModeBanner mode={mode} />

      <div className={styles.ctaSpacer} />
      <div className={styles.ctaDock}>
        <PillButton variant="accent" onClick={() => setStage('active')}>▷ Start Workout</PillButton>
      </div>
    </main>
  );
}
