import { ExerciseBlock } from '../../components/ExerciseBlock';
import { FeedbackBlock } from '../../components/FeedbackBlock';
import { EX } from '../../data/exercises';
import { useSessionStore } from '../../stores/sessionStore';
import { useUpgradesStore, applyUpgrade } from '../../stores/upgradesStore';
import { SESSIONS } from '../../data/sessions';

export function PlyometricsTab() {
  const dayType = useSessionStore((s) => s.dayType);
  const mode = useSessionStore((s) => s.mode);
  const toggleUpgrade = useUpgradesStore((s) => s.toggle);
  const activeUpgrades = useUpgradesStore((s) => s.active);

  const block = SESSIONS[mode]?.[dayType] ?? SESSIONS.full[dayType];
  const keys = block?.plyo ?? [];

  if (keys.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--t2)', fontSize: 17, lineHeight: 1.6 }}>
        No plyometrics for this mode.
      </div>
    );
  }

  return keys.map((k) => {
    const ex = EX[k];
    if (!ex) return null;
    const upgradeActive = !!activeUpgrades[k];
    const eff = applyUpgrade(ex, upgradeActive);

    return (
      <ExerciseBlock
        key={k}
        exerciseKey={k}
        name={eff.displayName}
        originalName={ex.name}
        target={ex.target}
        cue={ex.cue}
        url={eff.url}
        tags={ex.tags}
        upgrade={ex.upgrade}
        upgradeActive={upgradeActive}
        onToggleUpgrade={() => toggleUpgrade(k)}
      >
        <FeedbackBlock
          exerciseKey={k}
          exerciseName={eff.savedName}
          exerciseType="plyo"
          measure={ex.measure}
          isUpgrade={eff.isUpgrade}
        />
      </ExerciseBlock>
    );
  });
}
