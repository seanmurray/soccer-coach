// Prompt builders for the session cue + post-session debrief.
//
// Spec §13:
//   - Cue: 1-2 sentences, direct coaching cue. Doesn't start with "Today" or
//     "Focus on". Fired on workout entry.
//   - Debrief: honest coach persona, NOT empty praise. Calls out incomplete
//     sessions explicitly. Thresholds:
//       0 sets + <20 min   → CRITICAL — session essentially skipped
//       <3 sets + <20 min  → WARNING — partial session
//       warmup skipped + blocks untouched → NOTE
//       otherwise → honest assessment, praise only what warrants it.
//
// Both prompts return { system, messages, maxTokens } so the caller can hand
// them straight to claudeProxy.askClaude.

import { DAY_TYPE_INFO, MODE_DATA } from '../data/sessions';
import { getPhaseLabel } from './periodization';

// Build the readiness lines, skipping any field the user marked as
// "no data" (null). Surfaces an explicit note when objective inputs are
// missing so the model doesn't lean confidently on subjective signal.
function readinessLines({ rec, body, mot, battery, stress }) {
  const lines = ['Readiness:'];
  if (rec     != null) lines.push(`  Recovery ${rec}% (Athlytic — lead signal)`);
  if (battery != null) lines.push(`  Battery ${battery}% (Athlytic)`);
  if (stress  != null) lines.push(`  Stress ${stress}/100 (Athlytic)`);
  if (body    != null) lines.push(`  Body feel ${body}/5`);
  if (mot     != null) lines.push(`  Motivation ${mot}/5`);

  const objectiveMissing = [rec, battery, stress].every((v) => v == null);
  if (objectiveMissing) {
    lines.push('  (No objective recovery data today — likely didn\'t wear watch overnight.)');
  }
  return lines;
}

// ─── SESSION CUE ────────────────────────────────────────────
export function buildSessionCuePrompt({
  rec, body, mot, battery, stress,
  mode, dayType, week,
}) {
  const dayLabel = DAY_TYPE_INFO[dayType]?.sub ?? dayType;
  const modeLabel = MODE_DATA[mode]?.label ?? mode;
  const phase = getPhaseLabel(week);

  const system = [
    'You are an honest, no-nonsense strength + conditioning coach for a 44-year-old indoor soccer player.',
    'Speak directly. 1-2 sentences max. No filler, no warm-up phrases.',
    'Do NOT start with "Today" or "Focus on" or "Your".',
    'Output should be a single coaching cue that names the highest-leverage thing for this exact session.',
  ].join(' ');

  const userBlock = [
    `Day: ${dayLabel} (${dayType})`,
    `Week: ${week} (${phase} phase)`,
    `Mode: ${modeLabel} (${mode})`,
    ...readinessLines({ rec, body, mot, battery, stress }),
  ].join('\n');

  return {
    system,
    messages: [{ role: 'user', content: userBlock }],
    maxTokens: 160,
  };
}

// ─── DEBRIEF ────────────────────────────────────────────────
//
// Decide which severity bucket to ask for, given the buffers and elapsed time.
// Returns one of: 'critical' | 'warning' | 'note' | 'honest'.
function classifySession({ setsCount, durationMin, warmupCheckedCount, warmupTotal, tabsVisited }) {
  if (setsCount === 0 && durationMin < 20) return 'critical';
  if (setsCount < 3 && durationMin < 20) return 'warning';
  const warmupSkipped = warmupTotal > 0 && warmupCheckedCount === 0;
  const fewTabs = (tabsVisited?.length ?? 0) <= 1;
  if (warmupSkipped && fewTabs) return 'note';
  return 'honest';
}

const SEVERITY_DIRECTIVES = {
  critical: 'This session was essentially skipped. Call it out directly. No softening. Tell the user what to do tomorrow to get back on track.',
  warning:  'This was a partial session. Acknowledge what was done, name what was missed, and say whether to repeat the work tomorrow or move on.',
  note:     'The user opened the app but skipped the warmup and most blocks. Note this without lecturing. One actionable suggestion.',
  honest:   'Give an honest assessment. Praise specifically what warrants it. If something was weak, say so. No empty praise.',
};

export function buildDebriefPrompt({
  // Readiness
  rec, body, mot, battery, stress,
  // Programming
  mode, dayType, week,
  // Buffers
  setsBuffer = [],
  exercisePerfBuffer = [],
  moduleUsageBuffer = [],
  warmupChecked = [],
  warmupTotal = 0,
  tabsVisited = [],
  sessionStartedAt,
  // Post-session
  sessionRpe = 7.5,
  energy = 3,
}) {
  const dayLabel = DAY_TYPE_INFO[dayType]?.sub ?? dayType;
  const modeLabel = MODE_DATA[mode]?.label ?? mode;
  const phase = getPhaseLabel(week);

  const start = sessionStartedAt ? new Date(sessionStartedAt) : null;
  const durationMin = start ? Math.round((Date.now() - start.getTime()) / 60000) : 0;

  const severity = classifySession({
    setsCount: setsBuffer.length,
    durationMin,
    warmupCheckedCount: warmupChecked.length,
    warmupTotal,
    tabsVisited,
  });

  // Build a compact set summary grouped by exercise key.
  const setsByEx = setsBuffer.reduce((acc, s) => {
    (acc[s.exercise_key] ??= { name: s.exercise_name, sets: [] }).sets.push(s);
    return acc;
  }, {});
  const setsSummary = Object.values(setsByEx)
    .map((v) => {
      const lines = v.sets.map(
        (s) => `  Set ${s.set_num}: ${s.actual_reps ?? '?'} reps @ ${s.actual_weight ?? '?'} lbs · RPE ${s.rpe ?? '?'}`
      );
      return `${v.name}\n${lines.join('\n')}`;
    })
    .join('\n');

  const perfSummary = exercisePerfBuffer
    .map((p) => `${p.exercise_name} (${p.exercise_type}) — Q ${p.quality ?? '?'}/5, RPE ${p.effort_rpe ?? '?'}, Ease ${p.ease ?? '?'}/5${p.notes ? ` — ${p.notes}` : ''}`)
    .join('\n');

  const moduleSummary = moduleUsageBuffer
    .map((m) => `${m.module_label}: ${Math.round((m.duration_seconds ?? 0) / 60)} min, ${m.exercises_done?.length ?? 0}/${m.exercises_total ?? 0} done`)
    .join('\n');

  const system = [
    'You are an honest strength + conditioning coach for a 44-year-old indoor soccer player.',
    'You do NOT give empty praise. You praise only what warrants it.',
    SEVERITY_DIRECTIVES[severity],
    'Output: 2-4 short sentences. Direct. No headers, no bullet points.',
  ].join(' ');

  const userBlock = [
    `Day: ${dayLabel} (${dayType}) · Week ${week} · ${phase} phase · Mode: ${modeLabel}`,
    `Duration: ~${durationMin} min`,
    `Tabs visited: ${tabsVisited.join(', ') || 'none'}`,
    `Warmup: ${warmupChecked.length}/${warmupTotal} items checked`,
    '',
    'Readiness going in:',
    ...readinessLines({ rec, body, mot, battery, stress }).slice(1).map((l) => l.trim()),
    '',
    'Post-session: ' + `RPE ${sessionRpe} · Energy ${energy}/5`,
    '',
    setsBuffer.length > 0
      ? `Sets logged (${setsBuffer.length} total):\n${setsSummary}`
      : 'Sets logged: 0',
    '',
    perfSummary
      ? `Per-exercise feedback (${exercisePerfBuffer.length}):\n${perfSummary}`
      : 'Per-exercise feedback: none',
    '',
    moduleSummary
      ? `Modules used:\n${moduleSummary}`
      : 'Modules used: none',
  ].join('\n');

  return {
    system,
    messages: [{ role: 'user', content: userBlock }],
    maxTokens: 320,
    severity,
  };
}
