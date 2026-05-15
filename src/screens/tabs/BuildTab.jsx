import { ExerciseBlock } from '../../components/ExerciseBlock';
import { SetTable } from '../../components/SetTable';
import { FeedbackBlock } from '../../components/FeedbackBlock';
import { ExerciseHistoryInline } from '../../components/ExerciseHistoryInline';
import { EX } from '../../data/exercises';
import { useSessionStore } from '../../stores/sessionStore';
import { useSwapsStore, applySwap } from '../../stores/swapsStore';
import { SESSIONS } from '../../data/sessions';

const SET_TABLE_TYPES = new Set(['strength']);
const ACCESSORY_DEFAULT = { sets: 3, reps: 8 };

export function BuildTab() {
  const dayType = useSessionStore((s) => s.dayType);
  const mode = useSessionStore((s) => s.mode);
  const setSwap = useSwapsStore((s) => s.setSwap);
  const activeSwaps = useSwapsStore((s) => s.active);

  const block = SESSIONS[mode]?.[dayType] ?? SESSIONS.full[dayType];
  const keys = block?.build ?? [];

  if (keys.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--t2)', fontSize: 17, lineHeight: 1.6 }}>
        No accessory work for this mode.
      </div>
    );
  }

  return keys.map((k) => {
    const ex = EX[k];
    if (!ex) return null;

    const useSetTable = SET_TABLE_TYPES.has(ex.type);
    const activeSwap = activeSwaps[k] ?? null;
    const eff = applySwap(ex, activeSwap);

    return (
      <ExerciseBlock
        key={k}
        exerciseKey={k}
        name={eff.displayName}
        originalName={ex.name}
        target={ex.target ?? `${ACCESSORY_DEFAULT.sets}×${ACCESSORY_DEFAULT.reps}`}
        cue={ex.cue}
        url={eff.url}
        tags={ex.tags}
        swaps={ex.swaps ?? []}
        activeSwap={activeSwap}
        onSelectSwap={(s) => setSwap(k, s)}
      >
        {useSetTable ? (
          <SetTable
            exerciseKey={k}
            exerciseName={eff.savedName}
            prescription={ACCESSORY_DEFAULT}
            context="build"
            showWeight
          />
        ) : (
          <FeedbackBlock exerciseKey={k} exerciseName={eff.savedName} exerciseType="build" />
        )}
        <ExerciseHistoryInline exerciseKey={k} kind={useSetTable ? 'sets' : 'feedback'} />
      </ExerciseBlock>
    );
  });
}
