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
import { TodayLoadStrip } from '../components/TodayLoadStrip';
import { HrPrescriptionBanner } from '../components/HrPrescriptionBanner';
import { RecoveryActivityBadge } from '../components/RecoveryActivityBadge';
import { MastersSpacingWarning } from '../components/MastersSpacingWarning';
import { WeekComplete } from '../components/WeekComplete';
import { useSessionStore } from '../stores/sessionStore';
import { MODE_INSIGHTS } from '../data/sessions';

const formatToday = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

export function TodayScreen({ onStartSession, onOpenModule, onNavigate }) {
  const rec = useSessionStore((s) => s.rec);
  const battery = useSessionStore((s) => s.battery);
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

      {/* Two big Athlytic rings — Recovery is the lead readiness signal
          (54% of the composite), Battery is the multi-day energy balance.
          Together they mirror the two rings on Athlytic's own home screen. */}
      <div className={styles.rings}>
        <ReadinessRing value={rec}     label="Recovery" color="#30d158" />
        <ReadinessRing value={battery} label="Battery"  color="#0a84ff" />
      </div>

      <ModeBanner mode={mode} />

      <RecoveryActivityBadge />

      <WeekComplete />

      {/* Glanceable training-load summary; full analytics live on the Load tab.
          Today's HR prescription stays here (it's about today's session) along
          with any working-max backfill suggestions from recent set history. */}
      <TodayLoadStrip onOpen={() => onNavigate?.('load')} />
      <HrPrescriptionBanner />
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
