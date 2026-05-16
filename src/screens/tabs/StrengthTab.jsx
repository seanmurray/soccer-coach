import { ExerciseBlock } from '../../components/ExerciseBlock';
import { SetTable } from '../../components/SetTable';
import { ExerciseHistoryInline } from '../../components/ExerciseHistoryInline';
import { EX } from '../../data/exercises';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSwapsStore, applySwap } from '../../stores/swapsStore';
import { ratioForSwap } from '../../data/swapMaxes';
import { SESSIONS } from '../../data/sessions';
import { getStrengthPrescription, calcLoad, tempoExplain } from '../../lib/periodization';

export function StrengthTab() {
  const dayType = useSessionStore((s) => s.dayType);
  const mode = useSessionStore((s) => s.mode);
  const week = useSessionStore((s) => s.week);
  const maxes = useSettingsStore((s) => s.maxes);
  const season = useSettingsStore((s) => s.season);
  const setSwap = useSwapsStore((s) => s.setSwap);
  const activeSwaps = useSwapsStore((s) => s.active);

  const block = SESSIONS[mode]?.[dayType] ?? SESSIONS.full[dayType];
  const keys = block?.strength ?? [];

  if (keys.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--t2)', fontSize: 17, lineHeight: 1.6 }}>
        No strength work for this mode.
      </div>
    );
  }

  return keys.map((k) => {
    const ex = EX[k];
    if (!ex) return null;

    const prx = getStrengthPrescription(k, week, mode, season);
    const rec = calcLoad(k, prx.pct, maxes);
    const target = `${prx.sets}×${prx.reps} @ ${Math.round(prx.pct * 100)}%`;

    const activeSwap = activeSwaps[k] ?? null;
    const eff = applySwap(ex, activeSwap);

    // Swap-aware base recommendation: when a swap is active and we have a
    // research-backed ratio, scale; if no ratio, surface "—" rather than
    // recommending the parent lift's weight (which would be misleading).
    let effectiveRec = rec;
    let recOverridePresent = false;
    let swapRatioReason = null;
    if (activeSwap) {
      const ratio = ratioForSwap(k, activeSwap);
      effectiveRec = ratio?.pct != null && rec ? Math.round((rec * ratio.pct) / 2.5) * 2.5 : null;
      recOverridePresent = true;
      swapRatioReason = ratio?.reason ?? 'No research-backed max ratio for this swap — set by feel.';
    }
    const load = effectiveRec ? `${effectiveRec} lbs` : (activeSwap ? '—' : 'Set max');

    return (
      <ExerciseBlock
        key={k}
        exerciseKey={k}
        name={eff.displayName}
        originalName={ex.name}
        target={target}
        load={load}
        tempo={prx.tempo}
        cue={ex.cue}
        url={eff.url}
        tags={ex.tags}
        contrast={prx.contrast}
        swaps={ex.swaps ?? []}
        activeSwap={activeSwap}
        onSelectSwap={(s) => setSwap(k, s)}
        defaultOpen
      >
        <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 10 }}>
          {tempoExplain(prx.tempo)}
        </div>
        {prx.note && (
          <div style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 14, lineHeight: 1.5 }}>
            {prx.note}
          </div>
        )}
        {activeSwap && swapRatioReason && (
          <div style={{ fontSize: 14, color: 'var(--amber)', marginBottom: 14, lineHeight: 1.5, fontStyle: 'italic' }}>
            {swapRatioReason}
          </div>
        )}
        <SetTable
          exerciseKey={k}
          exerciseName={eff.savedName}
          prescription={prx}
          context="strength"
          recOverride={effectiveRec}
          recOverridePresent={recOverridePresent}
        />
        <ExerciseHistoryInline exerciseKey={k} kind="sets" />
      </ExerciseBlock>
    );
  });
}
