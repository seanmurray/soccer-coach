import { useState } from 'react';
import styles from './LibraryScreen.module.css';
import { EXERCISES, PATTERNS } from '../data/exercises';
import { ExerciseCard } from '../components/ExerciseCard';

// Browse every move, grouped by movement pattern. Reference/learning mode —
// no Done toggle, just watch videos and read cues any time.
export function LibraryScreen() {
  const [filter, setFilter] = useState('all'); // 'all' | pattern key

  const patternKeys = Object.keys(PATTERNS).filter((p) =>
    EXERCISES.some((e) => e.pattern === p)
  );
  const shown = filter === 'all' ? patternKeys : [filter];

  return (
    <main className="screen">
      <div className={styles.header}>
        <div className="overline">Watch & learn</div>
        <div className="title-xl">MOVES</div>
      </div>

      <div className={`${styles.filterRow} scroll-x`}>
        <button
          type="button"
          className={`${styles.filterChip} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {patternKeys.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.filterChip} ${filter === p ? styles.active : ''}`}
            style={{ '--c': PATTERNS[p].color }}
            onClick={() => setFilter(p)}
          >
            {PATTERNS[p].emoji} {PATTERNS[p].short}
          </button>
        ))}
      </div>

      {shown.map((p) => {
        const list = EXERCISES.filter((e) => e.pattern === p);
        return (
          <div key={p}>
            <div className={styles.patternHead}>
              <span className={styles.patternEmoji}>{PATTERNS[p].emoji}</span>
              <span className={styles.patternName}>{PATTERNS[p].label}</span>
              <span className={styles.patternCount}>{list.length}</span>
            </div>
            {list.map((ex) => (
              <ExerciseCard key={ex.key} exercise={ex} />
            ))}
          </div>
        );
      })}
    </main>
  );
}
