import styles from './TodayScreen.module.css';
import common from '../components/Common.module.css';
import { ReadinessRing } from '../components/ReadinessRing';
import { ReadinessSliders } from '../components/ReadinessSliders';
import { ModeBanner } from '../components/ModeBanner';
import { DaySelector } from '../components/DaySelector';
import { ModuleRow } from '../components/ModuleRow';
import { AiInsightCard } from '../components/AiInsightCard';
import { WeekBar } from '../components/WeekBar';
import { MaxSuggestion } from '../components/MaxSuggestion';
import { ACWRCard } from '../components/ACWRCard';
import { CNSBudgetCard } from '../components/CNSBudgetCard';
import { SprintExposureCard } from '../components/SprintExposureCard';
import { RecentWorkoutsCard } from '../components/RecentWorkoutsCard';
import { HrPrescriptionBanner } from '../components/HrPrescriptionBanner';
import { RecoveryActivityBadge } from '../components/RecoveryActivityBadge';
import { MastersSpacingWarning } from '../components/MastersSpacingWarning';
import { WeekComplete } from '../components/WeekComplete';
import { useSessionStore } from '../stores/sessionStore';
import { MODE_INSIGHTS } from '../data/sessions';

const formatToday = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

export function TodayScreen({ onStartSession, onOpenModule }) {
  const rec = useSessionStore((s) => s.rec);
  const slp = useSessionStore((s) => s.slp);
  const mode = useSessionStore((s) => s.mode);
  const dayType = useSessionStore((s) => s.dayType);

  const insight = MODE_INSIGHTS[mode]?.[dayType] ?? '';

  return (
    <main className="screen">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className="overline">{formatToday(new Date())}</div>
          <div className="title-xl">Today</div>
        </div>
        <WeekBar />
      </div>

      <div className={styles.rings}>
        <ReadinessRing value={rec} label="Recovery" color="#30d158" />
        <ReadinessRing value={slp} label="Sleep"    color="#bf5af2" />
      </div>

      <ModeBanner mode={mode} />

      <RecoveryActivityBadge />

      <WeekComplete />

      {/* Long-term context: training-load trend (ACWR), short-window CNS
          fatigue, and any backfill suggestions for working maxes from
          recent set history. */}
      <ACWRCard />
      <CNSBudgetCard />
      <SprintExposureCard />
      <HrPrescriptionBanner />
      <RecentWorkoutsCard />
      <MaxSuggestion />

      <ReadinessSliders />

      <div className={`overline ${styles.label}`}>Session</div>
      <DaySelector />
      <MastersSpacingWarning />

      <div className={`overline ${styles.label}`} style={{ marginTop: 12 }}>Modules</div>
      <ModuleRow onOpen={onOpenModule} />

      <AiInsightCard>{insight || 'Set your readiness scores above.'}</AiInsightCard>

      <button type="button" className={common.cta} onClick={onStartSession}>
        Start Session →
      </button>
    </main>
  );
}
