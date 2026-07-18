import { ExerciseBlock } from '../../components/ExerciseBlock';
import { SetTable } from '../../components/SetTable';
import { FeedbackBlock } from '../../components/FeedbackBlock';
import { ExerciseHistoryInline } from '../../components/ExerciseHistoryInline';
import { SlotSwapControl } from '../../components/SlotSwapControl';
import { EX } from '../../data/exercises';
import { useSessionStore } from '../../stores/sessionStore';
import { useSlotStore } from '../../stores/slotStore';
import { buildHomesFor } from '../../data/rotation';
import { resolveSlot, savedNameFor, badgeFor } from '../../lib/resolveSlot';

const SET_TABLE_TYPES = new Set(['strength']);
const ACCESSORY_DEFAULT = { sets: 3, reps: 8 };

export function BuildTab() {
  const dayType = useSessionStore((s) => s.dayType);
  const mode = useSessionStore((s) => s.mode);
  const week = useSessionStore((s) => s.week);
  const today = useSlotStore((s) => s.today);
  const block = useSlotStore((s) => s.block);

  // Build homes come from the centralized upper/lower plan, trimmed by mode.
  const homes = buildHomesFor(dayType, mode);

  if (homes.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--t2)', fontSize: 17, lineHeight: 1.6 }}>
        No accessory work for this mode.
      </div>
    );
  }

  return homes.map((homeKey) => {
    const res = resolveSlot(homeKey, week, today[homeKey], block[homeKey]);
    const activeEx = res.isCustom ? null : EX[res.activeKey];
    const savedName = savedNameFor(res);
    const badge = badgeFor(res);

    // Custom entries and loaded accessories both use a SetTable; only
    // feedback-style built-ins (no set logging) fall through to FeedbackBlock.
    const useSetTable = res.isCustom || SET_TABLE_TYPES.has(activeEx?.type);
    const target = activeEx?.target ?? `${ACCESSORY_DEFAULT.sets}×${ACCESSORY_DEFAULT.reps}`;

    return (
      <ExerciseBlock
        key={homeKey}
        exerciseKey={res.activeKey}
        name={res.name}
        badge={badge}
        originalName={res.homeName}
        target={target}
        cue={activeEx?.cue}
        url={activeEx?.url}
        tags={activeEx?.tags ?? []}
      >
        {useSetTable ? (
          <SetTable
            exerciseKey={res.activeKey}
            exerciseName={savedName}
            prescription={ACCESSORY_DEFAULT}
            context="build"
            showWeight
          />
        ) : (
          <FeedbackBlock exerciseKey={res.activeKey} exerciseName={savedName} exerciseType="build" />
        )}
        <ExerciseHistoryInline exerciseKey={res.activeKey} kind={useSetTable ? 'sets' : 'feedback'} />
        <SlotSwapControl homeKey={homeKey} week={week} activeKey={res.activeKey} isCustom={res.isCustom} />
      </ExerciseBlock>
    );
  });
}
