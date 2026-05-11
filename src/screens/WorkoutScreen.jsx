import { useState } from 'react';
import styles from './WorkoutScreen.module.css';
import common from '../components/Common.module.css';
import { useShallow } from 'zustand/react/shallow';
import { AiInsightCard } from '../components/AiInsightCard';
import { PhaseContextBanner } from '../components/PhaseContextBanner';
import { useSessionStore } from '../stores/sessionStore';
import { DAY_TYPE_INFO, MODE_DATA } from '../data/sessions';
import { getPhaseLabel } from '../lib/periodization';
import { useSessionCue } from '../hooks/useSessionCue';
import { WarmupTab } from './tabs/WarmupTab';
import { AgilityTab } from './tabs/AgilityTab';
import { PlyometricsTab } from './tabs/PlyometricsTab';
import { StrengthTab } from './tabs/StrengthTab';
import { BuildTab } from './tabs/BuildTab';
import { ConditioningTab } from './tabs/ConditioningTab';

const NON_COND_TABS = [
  { id: 'warmup',   label: 'Warm-up' },
  { id: 'agility',  label: 'Agility' },
  { id: 'plyo',     label: 'Plyometrics' },
  { id: 'strength', label: 'Strength' },
  { id: 'build',    label: 'Build / Trunk' },
];

const COND_TABS = [
  { id: 'warmup',       label: 'Warm-up' },
  { id: 'conditioning', label: 'Conditioning' },
];

const TAB_COMPONENTS = {
  warmup:       WarmupTab,
  agility:      AgilityTab,
  plyo:         PlyometricsTab,
  strength:     StrengthTab,
  build:        BuildTab,
  conditioning: ConditioningTab,
};

export function WorkoutScreen({ onFinish }) {
  // Keep the selector flat — useShallow only compares one level deep, so a
  // nested object literal would produce a new identity every render and
  // re-trigger React 19's getSnapshot caching check, infinite-looping.
  const {
    dayType, week, mode, logTabVisit, sessionStartedAt,
    rec, slp, body, mot, battery, stress,
  } = useSessionStore(
    useShallow((s) => ({
      dayType: s.dayType, week: s.week, mode: s.mode,
      logTabVisit: s.logTabVisit,
      sessionStartedAt: s.sessionStartedAt,
      rec: s.rec, slp: s.slp, body: s.body, mot: s.mot, battery: s.battery, stress: s.stress,
    }))
  );

  const tabs = dayType === 'cond' ? COND_TABS : NON_COND_TABS;
  const [tab, setTab] = useState(tabs[0].id);

  // If the user changes day type while on the workout screen, reset to the
  // first valid tab for the new day.
  if (!tabs.find((t) => t.id === tab)) {
    setTab(tabs[0].id);
  }

  const handleTab = (id) => {
    setTab(id);
    logTabVisit(id);
  };

  const dayInfo = DAY_TYPE_INFO[dayType];
  const modeLabel = MODE_DATA[mode]?.label ?? '';
  const phase = getPhaseLabel(week);

  // Session cue: try Claude first, fall back to the static MODE_INSIGHTS line
  // if the call fails or the session hasn't started.
  const { cue, fallback, isLoading: cueLoading, error: cueError } = useSessionCue({
    sessionStartedAt, rec, slp, body, mot, battery, stress, mode, dayType, week,
  });
  const cueText = cue ?? (cueError ? fallback : fallback);

  const TabBody = TAB_COMPONENTS[tab];

  return (
    <main className="screen">
      <div className={styles.header}>
        <div className={styles.title}>{dayInfo?.sub ?? 'Workout'}</div>
        <div className={styles.sub}>Week {week} · {phase} · {modeLabel}</div>
      </div>

      <PhaseContextBanner />

      <div className={styles.tabBar} role="tablist" aria-label="Workout sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => handleTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>{TabBody && <TabBody />}</div>

      <AiInsightCard label="Session Cue" loading={cueLoading}>
        {cueText || 'Start a session to load a coaching cue.'}
      </AiInsightCard>

      <button type="button" className={common.cta} onClick={onFinish}>
        Finish Session →
      </button>
    </main>
  );
}
