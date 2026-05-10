import { useState } from 'react';
import styles from './WorkoutScreen.module.css';
import common from '../components/Common.module.css';
import { AiInsightCard } from '../components/AiInsightCard';
import { useSessionStore } from '../stores/sessionStore';
import { DAY_TYPE_INFO, MODE_DATA, SESSIONS } from '../data/sessions';
import { getPhaseLabel } from '../lib/periodization';

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

export function WorkoutScreen({ onFinish }) {
  const dayType = useSessionStore((s) => s.dayType);
  const week = useSessionStore((s) => s.week);
  const mode = useSessionStore((s) => s.mode);
  const logTabVisit = useSessionStore((s) => s.logTabVisit);

  const tabs = dayType === 'cond' ? COND_TABS : NON_COND_TABS;
  const [tab, setTab] = useState(tabs[0].id);

  const handleTab = (id) => { setTab(id); logTabVisit(id); };

  const dayInfo = DAY_TYPE_INFO[dayType];
  const modeLabel = MODE_DATA[mode]?.label ?? '';
  const phase = getPhaseLabel(week);

  const session = SESSIONS[mode]?.[dayType] ?? SESSIONS.full[dayType];

  return (
    <main className="screen">
      <div className={styles.header}>
        <div className={styles.title}>{dayInfo?.sub ?? 'Workout'}</div>
        <div className={styles.sub}>Week {week} · {phase} · {modeLabel}</div>
      </div>

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

      <div className={styles.placeholder}>
        <strong>{tabs.find((t) => t.id === tab)?.label}</strong>
        {tab === 'conditioning' && session?.protocols ? (
          <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6 }}>
            {session.protocols.map((p) => (
              <li key={p.name}><strong style={{ color: 'var(--t1)' }}>{p.name}</strong> — {p.desc}</li>
            ))}
          </ul>
        ) : tab !== 'warmup' && session?.[tab] ? (
          <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.6 }}>
            {session[tab].map((key) => <li key={key}>{key}</li>)}
          </ul>
        ) : (
          <p style={{ marginTop: 8 }}>
            Block content lands here — exercise blocks, set rows, FRC items, swap/upgrade pills, rest-timer wiring.
          </p>
        )}
      </div>

      <AiInsightCard label="Session Cue" loading />

      <button type="button" className={common.cta} onClick={onFinish}>
        Finish Session →
      </button>
    </main>
  );
}
