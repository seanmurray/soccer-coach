import { useState } from 'react';
import styles from './flow.module.css';
import uiStyles from '../../components/ui/ui.module.css';
import { FlowHeader } from './FlowHeader';
import { Stepper } from '../../components/ui/Stepper';
import { BarScale } from '../../components/ui/BarScale';
import { PillButton, YesNo } from '../../components/ui/FullSheet';
import { useSessionStore } from '../../stores/sessionStore';
import { DAY_TYPE_INFO } from '../../data/sessions';
import { fmtDuration } from '../../lib/workoutFormat';

const SESSION_RPE = [
  { value: 6,   label: 'Easy',          desc: 'Light day, plenty left' },
  { value: 6.5, label: 'Easy +',        desc: 'Comfortable throughout' },
  { value: 7,   label: 'Moderate',      desc: 'A solid, normal effort' },
  { value: 7.5, label: 'Moderate +',    desc: 'Worked, still in control' },
  { value: 8,   label: 'Hard',          desc: 'Challenging at times, still under control' },
  { value: 8.5, label: 'Hard +',        desc: 'Pushed most of the way' },
  { value: 9,   label: 'Very hard',     desc: 'Deep in the tank' },
  { value: 9.5, label: 'Brutal',        desc: 'Barely hung on' },
  { value: 10,  label: 'Max',           desc: 'Nothing left at all' },
];

const ENERGY = [
  { value: 1, label: 'Empty',   desc: 'Totally drained' },
  { value: 2, label: 'Tired',   desc: 'Running low' },
  { value: 3, label: 'Okay',    desc: 'About normal' },
  { value: 4, label: 'Good',    desc: 'Still have some pop' },
  { value: 5, label: 'Buzzing', desc: 'Could go again' },
];

// Step 4: Workout Complete. Workout length (editable — fixes "forgot to
// tap Finish" sessions that would otherwise read 4 hours), did you complete
// all sets, session RPE + post-session energy (same two numbers the old
// sheet captured — the debrief + load model read them), and two optional
// reflections. Complete Workout saves.
export function WorkoutComplete({ saving, onConfirm }) {
  const dayType = useSessionStore((s) => s.dayType);
  const week = useSessionStore((s) => s.week);
  const startedAt = useSessionStore((s) => s.sessionStartedAt);
  const endedAt = useSessionStore((s) => s.sessionEndedAt);
  const setStage = useSessionStore((s) => s.setStage);

  const measured = startedAt && endedAt
    ? Math.max(1, Math.round((new Date(endedAt) - new Date(startedAt)) / 60000))
    : null;

  const [minutes, setMinutes] = useState(measured);
  const [editLen, setEditLen] = useState(false);
  const [allSets, setAllSets] = useState(true);
  const [sessionRpe, setSessionRpe] = useState(7.5);
  const [energy, setEnergy] = useState(3);
  const [achievement, setAchievement] = useState('');
  const [improvement, setImprovement] = useState('');

  const submit = () => {
    onConfirm({
      sessionRpe,
      energy,
      minutes: minutes !== measured ? minutes : null,
      allSets,
      achievement: achievement.trim(),
      improvement: improvement.trim(),
    });
  };

  return (
    <main className="screen">
      <FlowHeader
        onBack={saving ? null : () => setStage('active')}
        title={DAY_TYPE_INFO[dayType]?.sub}
        sub={`Week ${week} · Complete`}
      />
      <div className="title-xl">Workout Complete</div>
      <p className={styles.lede}>Nice work. Tell us how it went.</p>

      <div className={uiStyles.card}>
        <div className={uiStyles.cardHead}>
          <div className={uiStyles.cardLabel}>Workout length</div>
          <button type="button" className={styles.linkBtn} onClick={() => setEditLen((e) => !e)}>
            {editLen ? 'Done' : 'Edit'}
          </button>
        </div>
        {editLen ? (
          <Stepper value={minutes} onChange={setMinutes} step={5} min={1} max={600} unit="min" />
        ) : (
          <div className={styles.bigStat}>{minutes ? fmtDuration(minutes) : '—'}</div>
        )}
      </div>

      <YesNo question="Did you complete all sets?" value={allSets} onChange={setAllSets} />

      <BarScale
        question="How hard was today's workout?"
        options={SESSION_RPE}
        value={sessionRpe}
        onChange={setSessionRpe}
        lowLabel="Easy"
        highLabel="Max"
      />
      <BarScale
        question="How's your energy now?"
        options={ENERGY}
        value={energy}
        onChange={setEnergy}
        lowLabel="Empty"
        highLabel="Buzzing"
      />

      <div className={uiStyles.card}>
        <div className={uiStyles.cardLabel}>What is something you achieved today?</div>
        <textarea
          className={uiStyles.textArea}
          placeholder="Add an achievement"
          value={achievement}
          onChange={(e) => setAchievement(e.target.value)}
        />
      </div>
      <div className={uiStyles.card}>
        <div className={uiStyles.cardLabel}>What could you have done better?</div>
        <textarea
          className={uiStyles.textArea}
          placeholder="Add an improvement goal"
          value={improvement}
          onChange={(e) => setImprovement(e.target.value)}
        />
      </div>

      <div className={styles.ctaSpacer} />
      <div className={styles.ctaDock}>
        <PillButton variant="accent" onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : '✓ Complete Workout'}
        </PillButton>
      </div>
    </main>
  );
}
