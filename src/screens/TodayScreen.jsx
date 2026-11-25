import styles from './TodayScreen.module.css';
import dash from '../components/dashboard/Dashboard.module.css';
import flow from './workout/flow.module.css';
import { PillButton } from '../components/ui/FullSheet';
import { ReadinessHero } from '../components/dashboard/ReadinessHero';
import { LoadTiles } from '../components/dashboard/LoadTiles';
import { MaxSuggestion } from '../components/MaxSuggestion';
import { HrPrescriptionBanner } from '../components/HrPrescriptionBanner';
import { RecoveryActivityBadge } from '../components/RecoveryActivityBadge';
import { WeekComplete } from '../components/WeekComplete';
import { LoadScreen } from './LoadScreen';
import { useSessionStore } from '../stores/sessionStore';
import { DAY_TYPE_INFO, MODE_DATA, MODE_INSIGHTS } from '../data/sessions';
import { getPhaseLabel } from '../lib/periodization';

const scrollToLoad = () =>
  document.getElementById('training-load')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const formatToday = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

// Dashboard: readiness hero (latest check-in), this week's progress with the
// days × weeks grid + Complete Week, load / sprint tiles, the next session,
// any banners that need attention, then the full Training load section.
// "View Today's Session" stays docked above the tab bar.
export function TodayScreen({ onStartSession }) {
  const mode = useSessionStore((s) => s.mode);
  const dayType = useSessionStore((s) => s.dayType);
  const week = useSessionStore((s) => s.week);
  const inSession = useSessionStore((s) => !!s.sessionStartedAt);

  const insight = MODE_INSIGHTS[mode]?.[dayType] ?? '';
  const phase = getPhaseLabel(week);

  return (
    <main className="screen">
      <div className={dash.header}>
        <div>
          <div className={dash.wordmark}>SOCCER <span>COACH</span></div>
          <div className={dash.date}>{formatToday(new Date())}</div>
        </div>
        <div className={dash.weekPill}>Wk {week} <span>{phase}</span></div>
      </div>

      <ReadinessHero />

      <WeekComplete />

      <LoadTiles onOpen={scrollToLoad} />

      <div className={dash.sessionCard}>
        <div className={dash.sessionKicker}>{inSession ? 'In progress' : 'Next up'}</div>
        <div className={dash.sessionName}>{DAY_TYPE_INFO[dayType]?.sub ?? 'Workout'}</div>
        <div className={dash.sessionMeta}>Week {week} · last check-in: {MODE_DATA[mode]?.label}</div>
        {insight && <div className={dash.sessionInsight}>{insight}</div>}
      </div>

      <RecoveryActivityBadge />
      <HrPrescriptionBanner />
      <MaxSuggestion />

      {/* Training load — formerly its own tab. */}
      <section id="training-load" className={styles.loadSection}>
        <div className={`overline ${styles.label}`}>Training load</div>
        <LoadScreen embedded />
      </section>

      <div className={flow.ctaSpacer} />
      <div className={flow.ctaDock}>
        <PillButton variant="accent" onClick={onStartSession}>
          {inSession ? '▷ Resume Workout' : 'View Today’s Session →'}
        </PillButton>
      </div>
    </main>
  );
}
