import { useSettingsStore } from '../stores/settingsStore';
import { EX } from '../data/exercises';

// Per-exercise logging prefs: unit (reps/secs) and whether to track weight.
// Per-exercise user override from settings, else the exercise definition's
// default, else `showWeight` as passed in. The weight toggle is only offered
// on bodyweight-default exercises (a Copenhagen can progress to load); loaded
// lifts keep weight unconditionally.
export function useLogPrefs(exerciseKey, showWeight = true) {
  const unitOverride = useSettingsStore((s) => s.exUnits[exerciseKey]);
  const weightOverride = useSettingsStore((s) => s.exWeighted[exerciseKey]);
  const setExUnit = useSettingsStore((s) => s.setExUnit);
  const setExWeighted = useSettingsStore((s) => s.setExWeighted);
  const unit = unitOverride ?? EX[exerciseKey]?.unit ?? 'reps';
  const canToggleWeight = !showWeight || weightOverride != null;
  const effShowWeight = weightOverride ?? showWeight;
  return {
    unit,
    effShowWeight,
    canToggleWeight,
    toggleUnit: () => setExUnit(exerciseKey, unit === 'secs' ? 'reps' : 'secs'),
    toggleWeight: () => setExWeighted(exerciseKey, !effShowWeight),
  };
}

