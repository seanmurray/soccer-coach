import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styles from './TodayScreen.module.css';
import { TEMPLATES, TEMPLATE_BY_ID, CONTEXTS } from '../data/templates';
import { EXERCISE_BY_KEY } from '../data/exercises';
import { ExerciseCard } from '../components/ExerciseCard';
import { FinishSheet } from '../components/FinishSheet';
import { saveYouthSession } from '../lib/saveSession';
import { sessionXp } from '../lib/xp';

// In-progress session is persisted so an iPad PWA reload mid-workout keeps the
// checkmarks (Safari suspends/reloads backgrounded tabs).
const SESSION_KEY = 'ya-session';
function readSession() {
  try {
    const v = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (v && TEMPLATE_BY_ID[v.templateId] && Array.isArray(v.done)) return v;
  } catch { /* ignore */ }
  return null;
}

export function TodayScreen() {
  const queryClient = useQueryClient();
  const [context, setContext] = useState('home');     // which day type is shown in the picker
  const [session, setSession] = useState(readSession); // { templateId, context, done: [] } | null
  const [finishing, setFinishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justFinished, setJustFinished] = useState(null); // { count } after save

  useEffect(() => {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
  }, [session]);

  const startSession = (templateId, ctx) =>
    setSession({ templateId, context: ctx, done: [] });

  const toggleDone = (key) =>
    setSession((s) => {
      const done = new Set(s.done);
      if (done.has(key)) done.delete(key); else done.add(key);
      return { ...s, done: [...done] };
    });

  const confirmFinish = async ({ feel, note }) => {
    setSaving(true);
    const result = await saveYouthSession({
      templateId: session.templateId,
      context: session.context,
      doneKeys: session.done,
      feel,
      note,
    });
    setSaving(false);
    if (!result.ok) {
      alert('Could not save: ' + (result.error?.message ?? 'unknown error'));
      return;
    }
    const count = session.done.length;
    setFinishing(false);
    setSession(null);
    setJustFinished({ count, xp: sessionXp(count) });
    queryClient.invalidateQueries({ queryKey: ['youth_sessions'] });
  };

  // ─── Success splash ───────────────────────────────────────
  if (justFinished) {
    return (
      <main className="screen">
        <div className={styles.success}>
          <div className={styles.successEmoji}>🏆</div>
          <div className={styles.successTitle}>DONE!</div>
          <div className={styles.successText}>
            You finished {justFinished.count} {justFinished.count === 1 ? 'move' : 'moves'} today.
            <br />Keep the streak going!
          </div>
          <div className={styles.xpEarned}>+{justFinished.xp} XP</div>
          <button type="button" className={styles.successBtn} onClick={() => setJustFinished(null)}>
            Back to start
          </button>
        </div>
      </main>
    );
  }

  // ─── Active session ───────────────────────────────────────
  if (session) {
    const template = TEMPLATE_BY_ID[session.templateId];
    const doneSet = new Set(session.done);
    const allKeys = template.blocks.flatMap((b) => b.items);
    const total = allKeys.length;
    const completed = allKeys.filter((k) => doneSet.has(k)).length;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    return (
      <main className="screen">
        <div className={styles.sessTop}>
          <button type="button" className={styles.backBtn} onClick={() => setSession(null)}>
            ← Change
          </button>
          <span className={styles.sessName}>
            {CONTEXTS[session.context].emoji} {template.name}
          </span>
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.progressText}>{completed} / {total} done</div>
        </div>

        {template.blocks.map((block, bi) => (
          <div key={bi}>
            <div className={styles.blockLabel}>
              <span className={styles.blockTitle}>{block.title}</span>
              {block.note && <span className={styles.blockNote}>{block.note}</span>}
            </div>
            {block.items.map((key) => {
              const ex = EXERCISE_BY_KEY[key];
              if (!ex) return null;
              return (
                <ExerciseCard
                  key={key}
                  exercise={ex}
                  done={doneSet.has(key)}
                  onToggle={toggleDone}
                />
              );
            })}
          </div>
        ))}

        <button
          type="button"
          className={styles.finishBtn}
          disabled={completed === 0}
          onClick={() => setFinishing(true)}
        >
          Finish workout →
        </button>

        <FinishSheet
          open={finishing}
          saving={saving}
          onCancel={() => setFinishing(false)}
          onConfirm={confirmFinish}
        />
      </main>
    );
  }

  // ─── Picker ───────────────────────────────────────────────
  const templates = TEMPLATES.filter((t) => t.context === context);

  return (
    <main className="screen">
      <div className={styles.header}>
        <div className="overline">Let's train</div>
        <div className="title-xl">TODAY</div>
      </div>

      <div className={styles.sectionLabel}>Where are you training?</div>
      <div className={styles.contextRow}>
        {Object.entries(CONTEXTS).map(([id, c]) => (
          <button
            key={id}
            type="button"
            className={`${styles.contextBtn} ${context === id ? styles.active : ''}`}
            onClick={() => setContext(id)}
          >
            <span className={styles.contextEmoji}>{c.emoji}</span>
            <span className={styles.contextName}>{c.label}</span>
            <span className={styles.contextNote}>{c.note}</span>
          </button>
        ))}
      </div>

      <div className={styles.sectionLabel}>Pick today's workout</div>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className={styles.templateCard}
          onClick={() => startSession(t.id, context)}
        >
          <div className={styles.templateName}>{t.name}</div>
          <div className={styles.templateEmphasis}>{t.emphasis}</div>
          <div className={styles.templateBlurb}>{t.blurb}</div>
          <span className={styles.templateGo}>Start →</span>
        </button>
      ))}
    </main>
  );
}
