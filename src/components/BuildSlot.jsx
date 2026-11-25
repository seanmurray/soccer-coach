import { ExerciseBlock } from './ExerciseBlock';
import { SetTable, LogPrefsControls } from './SetTable';
import { useSessionStore } from '../stores/sessionStore';
import { SlotSwapControl } from './SlotSwapControl';
import { EX } from '../data/exercises';
import { useSlotStore } from '../stores/slotStore';
import { resolveSlot, savedNameFor, badgeFor } from '../lib/resolveSlot';

// One build/accessory slot: resolves the active exercise (rotation + swap +
// custom), then always renders a SetTable so every accessory has sets / reps /
// weight entry. Build work is countable — nothing here is a feedback-only
// movement. Used by the Build tab and the conditioning-day finisher.

const ACCESSORY_DEFAULT = { sets: 3, reps: 8 };

// Pull a set/rep count out of a target string: "4×5", "3x8", "3×30 sec each".
function parseTarget(target) {
  const m = String(target ?? '').match(/(\d+)\s*[×x]\s*(\d+)/);
  return m ? { sets: Number(m[1]), reps: Number(m[2]) } : null;
}

export function BuildSlot({ homeKey, week }) {
  const today = useSlotStore((s) => s.today);
  const block = useSlotStore((s) => s.block);

  const res = resolveSlot(homeKey, week, today[homeKey], block[homeKey]);
  const activeEx = res.isCustom ? null : EX[res.activeKey];
  const savedName = savedNameFor(res);
  const badge = badgeFor(res);

  const target = activeEx?.target ?? `${ACCESSORY_DEFAULT.sets}×${ACCESSORY_DEFAULT.reps}`;
  const prescription = parseTarget(target) ?? ACCESSORY_DEFAULT;
  // Pure-bodyweight moves don't prescribe external load → reps only. Everything
  // else shows a weight field (incl. med-ball throws, where the "weight" is the
  // ball). Custom entries always show weight — we don't know what they are.
  const showWeight = res.isCustom ? true : !activeEx?.bodyweight;

  const logged = useSessionStore((s) => s.setsBuffer.filter((r) => r.exercise_key === res.activeKey).length);

  return (
    <ExerciseBlock
      exerciseKey={res.activeKey}
      name={res.name}
      badge={badge}
      originalName={res.homeName}
      target={`${prescription.sets} sets × ${prescription.reps} ${/sec/i.test(target) ? 'sec' : 'reps'}`}
      cue={activeEx?.cue}
      url={activeEx?.url}
      complete={logged >= prescription.sets}
      swapContent={<SlotSwapControl homeKey={homeKey} week={week} activeKey={res.activeKey} isCustom={res.isCustom} />}
      settingsContent={<LogPrefsControls exerciseKey={res.activeKey} showWeight={showWeight} />}
    >
      <SetTable
        key={res.activeKey}
        exerciseKey={res.activeKey}
        exerciseName={savedName}
        prescription={prescription}
        context="build"
        showWeight={showWeight}
      />
    </ExerciseBlock>
  );
}
