import wstyles from '../../components/Warmup.module.css';
import { WARMUP, WARMUP_OTA_URL, FRC_SHORT } from '../../data/frc';
import { FrcBlock } from '../../components/FrcBlock';
import { useSessionStore } from '../../stores/sessionStore';
import { useShallow } from 'zustand/react/shallow';

export function WarmupTab() {
  const { warmupChecked, setWarmupChecked } = useSessionStore(
    useShallow((s) => ({ warmupChecked: s.warmupChecked, setWarmupChecked: s.setWarmupChecked }))
  );

  const allDone = warmupChecked.length === WARMUP.length;
  const isChecked = (i) => warmupChecked.includes(i);

  const toggleAll = () => {
    if (allDone) {
      WARMUP.forEach((_, i) => setWarmupChecked(i, false));
    } else {
      WARMUP.forEach((_, i) => setWarmupChecked(i, true));
    }
  };

  return (
    <>
      <div className={wstyles.card}>
        <div className={wstyles.head}>
          <div className={wstyles.title}>OTA Dynamic Warm-Up</div>
          <button
            type="button"
            className={`${wstyles.checkAll} ${allDone ? wstyles.allDone : ''}`}
            onClick={toggleAll}
          >
            {allDone ? 'All Done ✓' : 'Check All'}
          </button>
        </div>
        <a href={WARMUP_OTA_URL} target="_blank" rel="noreferrer" className={wstyles.video}>
          ▸ Reference
        </a>
        {WARMUP.map((text, i) => (
          <label key={i} className={wstyles.item}>
            <input
              type="checkbox"
              className={wstyles.cb}
              checked={isChecked(i)}
              onChange={(e) => setWarmupChecked(i, e.target.checked)}
            />
            <span className={wstyles.text}>{text}</span>
          </label>
        ))}
      </div>

      <FrcBlock
        variant="short"
        title="FRC Pre-Session — ~8 min"
        sub="Joint prep + key PAILs/RAILs. Pair this with the OTA warmup for full readiness."
        items={FRC_SHORT}
      />
    </>
  );
}
