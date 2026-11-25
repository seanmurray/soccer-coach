import { useEffect, useState } from 'react';
import styles from './flow.module.css';
import { FlowHeader } from './FlowHeader';
import { PillButton } from '../../components/ui/FullSheet';
import { AiInsightCard } from '../../components/AiInsightCard';
import { PhaseContextBanner } from '../../components/PhaseContextBanner';
import { useSessionStore } from '../../stores/sessionStore';
import { useRestTimer } from '../../stores/restTimerStore';
import { DAY_TYPE_INFO, MODE_DATA } from '../../data/sessions';
import { getPhaseLabel } from '../../lib/periodization';
import { fmtClock } from '../../lib/workoutFormat';
import { useSessionCue } from '../../hooks/useSessionCue';
import { AgilityTab } from '../tabs/AgilityTab';
import { PlyometricsTab } from '../tabs/PlyometricsTab';
import { StrengthTab } from '../tabs/StrengthTab';
import { BuildTab } from '../tabs/BuildTab';
import { Icon } from '../../components/ui/Icon';
import { ConditioningTab } from '../tabs/ConditioningTab';

const SECTIONS = [
  { id: 'agility',  label: 'Agility',       Body: AgilityTab },
  { id: 'plyo',     label: 'Plyometrics',   Body: PlyometricsTab },
  { id: 'strength', label: 'Strength',      Body: StrengthTab },
  { id: 'build',    label: 'Build / Trunk', Body: BuildTab },
];
const COND_SECTIONS = [
  { id: 'conditioning', label: 'Conditioning', Body: ConditioningTab },
];

// Step 3: the workout itself — one scrolling page of exercise cards in
// session order (agility → plyo → strength → build, or conditioning), the
// session cue, then Finish / Cancel. Replaces the old sub-tab bar. Once you
// scroll past the title a compact header pins the day name + rest clock.
export function ActiveWorkout({ onFinish, onCancel }) {
  const dayType = useSessionStore((s) => s.dayType);
  const week = useSessionStore((s) => s.week);
  const mode = useSessionStore((s) => s.mode);
  const setStage = useSessionStore((s) => s.setStage);
  const logTabVisit = useSessionStore((s) => s.logTabVisit);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const rec = useSessionStore((s) => s.rec);
  const body = useSessionStore((s) => s.body);
  const mot = useSessionStore((s) => s.mot);
  const battery = useSessionStore((s) => s.battery);
  const stress = useSessionStore((s) => s.stress);
  const timerVisible = useRestTimer((t) => t.visible);
  const remaining = useRestTimer((t) => t.remaining);

  const sections = dayType === 'cond' ? COND_SECTIONS : SECTIONS;
  const dayName = DAY_TYPE_INFO[dayType]?.sub ?? 'Workout';

  // Every block is on one page now, so record them all as visited (keeps
  // soccer_sessions.metadata.tabs_visited meaningful for history).
  useEffect(() => {
    sections.forEach((s) => logTabVisit(s.id));
  }, [sections, logTabVisit]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 90);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { cue, fallback, isLoading: cueLoading } = useSessionCue({
    sessionStartedAt, rec, body, mot, battery, stress, mode, dayType, week,
  });

  return (
    <main className="screen">
      <div className={`${styles.pinned} ${scrolled ? styles.pinnedOn : ''}`} aria-hidden={!scrolled}>
        <button type="button" className={styles.backBtn} onClick={() => setStage('overview')} aria-label="Back to overview">‹</button>
        <div className={styles.pinTitle}>{dayName}</div>
        <div className={`${styles.pinTimer} ${timerVisible ? styles.pinTimerOn : ''}`}>
          <Icon name="timer" size={20} />{timerVisible ? ` ${fmtClock(remaining)}` : ''}
        </div>
      </div>

      <FlowHeader onBack={() => setStage('overview')} sub={`Week ${week} · ${getPhaseLabel(week)}`} />
      <div className="title-xl">{dayName}</div>
      <div className={styles.sub}>{MODE_DATA[mode]?.label} · {MODE_DATA[mode]?.sub}</div>

      <PhaseContextBanner />

      {sections.map(({ id, label, Body }) => (
        <section key={id} className={styles.block}>
          <h2 className={styles.blockTitle}>{label}</h2>
          <Body />
        </section>
      ))}

      <AiInsightCard label="Session Cue" loading={cueLoading}>
        {cue ?? fallback ?? 'Coaching cue unavailable.'}
      </AiInsightCard>

      <div className={styles.finishStack}>
        <PillButton variant="accent" onClick={onFinish}>✓ Finish Workout</PillButton>
        <PillButton onClick={onCancel}>Cancel Workout</PillButton>
      </div>
    </main>
  );
}
