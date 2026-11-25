import { useState } from 'react';
import { Screen } from '../components/Screen';
import styles from './ExercisesScreen.module.css';
import { EX } from '../data/exercises';
import { MODULES } from '../data/modules';
import { DAY_TYPE_INFO } from '../data/sessions';

// Exercise library — every movement in the program plus the standalone
// prehab/mobility routines (Modules), which used to live in a strip on
// Today. Read-only reference: tap a row for its coaching cue and demo link.

const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'routines', label: 'Routines' },
  { id: 'agility',  label: 'Agility' },
  { id: 'plyo',     label: 'Plyometrics' },
  { id: 'strength', label: 'Strength' },
];

const TYPE_LABEL = { agility: 'Agility', plyo: 'Plyometrics', strength: 'Strength' };
const TYPE_ORDER = ['agility', 'plyo', 'strength'];

const ALL_EXERCISES = Object.entries(EX).map(([key, e]) => ({ key, ...e }));

const dayLabels = (tags = []) =>
  tags.map((t) => DAY_TYPE_INFO[t]?.sub).filter(Boolean).join(' · ');

export function ExercisesScreen({ onOpenModule }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState(null);

  const q = query.trim().toLowerCase();
  const matches = (text) => !q || text.toLowerCase().includes(q);

  // No manual memo — the React Compiler handles it, and 112 rows is cheap.
  const groups = filter === 'routines' ? [] : (filter === 'all' ? TYPE_ORDER : [filter])
      .map((type) => ({
        type,
        items: ALL_EXERCISES
          .filter((e) => e.type === type)
          .filter((e) => !q || e.name.toLowerCase().includes(q) || (e.muscle ?? '').toLowerCase().includes(q))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.items.length > 0);

  const routines = (filter === 'all' || filter === 'routines')
    ? MODULES.map((m, i) => ({ ...m, index: i })).filter((m) => matches(m.label))
    : [];

  const nothing = routines.length === 0 && groups.length === 0;

  return (
    <Screen title="Exercises" titleStyle={{ marginBottom: 16 }}>
      <input
        type="search"
        className={styles.search}
        placeholder="Search exercises"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search exercises"
      />

      <div className={`scroll-x ${styles.filters}`} role="tablist" aria-label="Exercise type">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`${styles.chip} ${filter === f.id ? styles.chipActive : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {routines.length > 0 && (
        <section className={styles.section}>
          <div className={`overline ${styles.sectionLabel}`}>Routines</div>
          {routines.map((m) => (
            <button
              key={m.id}
              type="button"
              className={styles.routine}
              onClick={() => onOpenModule?.(m.index)}
            >
              <span className={styles.routineIcon} aria-hidden>{m.icon}</span>
              <span className={styles.routineText}>
                <span className={styles.name}>{m.label}</span>
                <span className={styles.sub}>{m.sub}</span>
              </span>
              <span className={styles.chev} aria-hidden>›</span>
            </button>
          ))}
        </section>
      )}

      {groups.map((g) => (
        <section key={g.type} className={styles.section}>
          <div className={`overline ${styles.sectionLabel}`}>
            {TYPE_LABEL[g.type]} <span className={styles.count}>{g.items.length}</span>
          </div>
          {g.items.map((e) => {
            const open = openKey === e.key;
            const sub = [
              e.target,
              g.type !== 'strength' ? dayLabels(e.tags) : null,
              e.muscle ? e.muscle[0].toUpperCase() + e.muscle.slice(1) : null,
            ].filter(Boolean).join(' · ');
            return (
              <div key={e.key} className={`${styles.row} ${open ? styles.rowOpen : ''}`}>
                <button
                  type="button"
                  className={styles.rowHead}
                  onClick={() => setOpenKey(open ? null : e.key)}
                  aria-expanded={open}
                >
                  <span className={styles.rowText}>
                    <span className={styles.name}>{e.name}</span>
                    {sub && <span className={styles.sub}>{sub}</span>}
                  </span>
                  <span className={styles.info} aria-hidden>i</span>
                </button>
                {open && (
                  <div className={styles.detail}>
                    {e.cue && <p className={styles.cue}>{e.cue}</p>}
                    {e.url && (
                      <a className={styles.watch} href={e.url} target="_blank" rel="noreferrer">
                        ▸ Watch demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {nothing && <div className={styles.empty}>No exercises match “{query}”.</div>}
    </Screen>
  );
}
