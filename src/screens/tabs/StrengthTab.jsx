import { ExerciseBlock } from '../../components/ExerciseBlock';
import { SetTable } from '../../components/SetTable';
import { ExerciseHistoryInline } from '../../components/ExerciseHistoryInline';
import { SlotSwapControl } from '../../components/SlotSwapControl';
import { EX } from '../../data/exercises';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSlotStore } from '../../stores/slotStore';
import { SESSIONS } from '../../data/sessions';
import { getStrengthPrescription, calcLoad, tempoExplain } from '../../lib/periodization';
import { resolveSlot, savedNameFor, badgeFor } from '../../lib/resolveSlot';

// Generic prescription for a custom (off-menu) lift — no % of a known max, so
// the athlete just logs sets/weight by feel.
const CUSTOM_RX = { sets: 4, reps: 6, pct: null, tempo: null, note: null, contrast: null };

export function StrengthTab() {
  const dayType = useSessionStore((s) => s.dayType);
  const mode = useSessionStore((s) => s.mode);
  const week = useSessionStore((s) => s.week);
  const maxes = useSettingsStore((s) => s.maxes);
  const season = useSettingsStore((s) => s.season);
  const today = useSlotStore((s) => s.today);
  const block = useSlotStore((s) => s.block);

  const dayBlock = SESSIONS[mode]?.[dayType] ?? SESSIONS.full[dayType];
  const homes = dayBlock?.strength ?? [];

  if (homes.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--t2)', fontSize: 17, lineHeight: 1.6 }}>
        No strength work for this mode.
      </div>
    );
  }

  return homes.map((homeKey) => {
    const res = resolveSlot(homeKey, week, today[homeKey], block[homeKey]);
    const activeEx = res.isCustom ? null : EX[res.activeKey];
    const savedName = savedNameFor(res);
    const badge = badgeFor(res);

    const prx = res.isCustom ? CUSTOM_RX : getStrengthPrescription(res.activeKey, week, mode, season);
    const rec = res.isCustom ? 0 : calcLoad(res.activeKey, prx.pct, maxes);
    const target = res.isCustom
      ? `${prx.sets}×${prx.reps} · log by feel`
      : `${prx.sets}×${prx.reps} @ ${Math.round(prx.pct * 100)}%`;
    const load = res.isCustom ? '—' : (rec ? `${rec} lbs` : 'Set max');

    return (
      <ExerciseBlock
        key={homeKey}
        exerciseKey={res.activeKey}
        name={res.name}
        badge={badge}
        originalName={res.homeName}
        target={target}
        load={load}
        tempo={res.isCustom ? null : prx.tempo}
        cue={activeEx?.cue}
        url={activeEx?.url}
        tags={activeEx?.tags ?? []}
        contrast={res.isCustom ? null : prx.contrast}
        defaultOpen
      >
        {!res.isCustom && prx.tempo && (
          <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 10 }}>
            {tempoExplain(prx.tempo)}
          </div>
        )}
        {!res.isCustom && prx.note && (
          <div style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 14, lineHeight: 1.5 }}>
            {prx.note}
          </div>
        )}
        <SetTable
          exerciseKey={res.activeKey}
          exerciseName={savedName}
          prescription={prx}
          context="strength"
          recOverride={res.isCustom ? null : rec}
          recOverridePresent={res.isCustom}
        />
        <ExerciseHistoryInline exerciseKey={res.activeKey} kind="sets" />
        <SlotSwapControl homeKey={homeKey} week={week} activeKey={res.activeKey} isCustom={res.isCustom} />
      </ExerciseBlock>
    );
  });
}
