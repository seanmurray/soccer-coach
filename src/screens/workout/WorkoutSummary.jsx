import styles from './flow.module.css';
import uiStyles from '../../components/ui/ui.module.css';
import { PillButton } from '../../components/ui/FullSheet';
import { DAY_TYPE_INFO } from '../../data/sessions';
import { fmtDuration } from '../../lib/workoutFormat';

const fmt = (n) => (n == null ? '—' : String(n));

// Shown right after a successful save: overview tiles (date, length,
// readiness score, session RPE) and every logged set, like the reference
// app's finished-day screen. Built from the save snapshot, so it doesn't
// need a refetch. The AI debrief generates in the background → History.
export function WorkoutSummary({ summary, onDone, onOpenHistory }) {
  const { snapshot, sessionRpe, energy, minutes, achievement, improvement, readinessScore } = summary;
  const dayName = DAY_TYPE_INFO[snapshot.dayType]?.sub ?? 'Workout';

  // Group sets by exercise, in the order they were logged.
  const byExercise = [];
  for (const set of [...snapshot.setsBuffer].sort((a, b) => a.performed_at.localeCompare(b.performed_at))) {
    let g = byExercise.find((x) => x.key === set.exercise_key);
    if (!g) { g = { key: set.exercise_key, name: set.exercise_name, sets: [] }; byExercise.push(g); }
    g.sets.push(set);
  }
  byExercise.forEach((g) => g.sets.sort((a, b) => a.set_num - b.set_num));

  return (
    <main className="screen">
      <div className={styles.doneTitle}>
        <div className="title-xl">{dayName}</div>
        <span className={styles.doneCheck} aria-label="Completed">✓</span>
      </div>
      <div className={styles.sub}>Week {snapshot.week} · Saved</div>

      <div className={styles.sectionHead}><h2 className={styles.h2}>Overview</h2></div>
      <div className={styles.tiles}>
        <Tile
          icon="▦"
          label="Completed"
          value={snapshot.sessionStartedAt
            ? new Date(snapshot.sessionStartedAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })
            : 'Today'}
        />
        <Tile icon="◷" label="Session length" value={minutes ? fmtDuration(minutes) : '—'} />
        <Tile icon="▮" label="Readiness" value={readinessScore != null ? `${Math.round(readinessScore)}` : '—'} />
        <Tile icon="▲" label="Session RPE" value={`${sessionRpe} RPE`} />
      </div>
      <div className={styles.sub} style={{ marginTop: 0 }}>Energy after: {energy}/5</div>

      {(achievement || improvement) && (
        <div className={uiStyles.card} style={{ marginTop: 14 }}>
          {achievement && (<><div className={uiStyles.cardLabel}>Achieved</div><p className={styles.reflect}>{achievement}</p></>)}
          {improvement && (<><div className={uiStyles.cardLabel} style={{ marginTop: achievement ? 12 : 0 }}>Next time</div><p className={styles.reflect}>{improvement}</p></>)}
        </div>
      )}

      <div className={styles.sectionHead}><h2 className={styles.h2}>Performance</h2></div>
      {byExercise.length === 0 && snapshot.exercisePerfBuffer.length === 0 && (
        <p className={styles.lede}>No sets were logged in this session.</p>
      )}
      {byExercise.map((g) => (
        <div key={g.key} className={styles.perfCard}>
          <div className={styles.perfName}>{g.name}</div>
          {g.sets.map((s) => (
            <div key={s.set_num} className={styles.perfRow}>
              <span>Set {s.set_num}</span>
              {s.actual_weight ? <span className={styles.perfChip}>{s.actual_weight}lb</span> : null}
              {s.actual_weight ? <span>×</span> : null}
              <span className={styles.perfChip}>{fmt(s.actual_reps)} {s.unit === 'secs' ? 'sec' : 'reps'} @ {fmt(s.rpe)} RPE</span>
            </div>
          ))}
        </div>
      ))}
      {snapshot.exercisePerfBuffer.map((p) => (
        <div key={p.exercise_key} className={styles.perfCard}>
          <div className={styles.perfName}>{p.exercise_name}</div>
          <div className={styles.perfRow}>
            <span className={styles.perfChip}>Quality {fmt(p.quality)}/5</span>
            <span className={styles.perfChip}>RPE {fmt(p.effort_rpe)}</span>
            {p.notes ? <span>{p.notes}</span> : null}
          </div>
        </div>
      ))}

      <p className={styles.lede}>Your coach debrief is being written — it shows up on this session in History.</p>

      <div className={styles.finishStack}>
        <PillButton variant="accent" onClick={onDone}>Done</PillButton>
        <PillButton onClick={onOpenHistory}>Open in History</PillButton>
      </div>
    </main>
  );
}

function Tile({ icon, label, value }) {
  return (
    <div className={styles.tile}>
      <div className={styles.tileIcon} aria-hidden>{icon}</div>
      <div className={styles.tileLabel}>{label}</div>
      <div className={styles.tileValue}>{value}</div>
    </div>
  );
}
