import styles from './Pills.module.css';
import { MODULES } from '../data/modules';

export function ModuleRow({ onOpen }) {
  return (
    <div className="scroll-x" aria-label="Modules">
      {MODULES.map((m, i) => (
        <button
          key={m.id}
          type="button"
          className={styles.modulePill}
          onClick={() => onOpen?.(i)}
        >
          <span className={styles.moduleIcon} aria-hidden>{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
