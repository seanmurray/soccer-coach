// Persist a finished session to youth_sessions. One row per workout, with the
// per-exercise checkmarks stored in an `items` jsonb so History can show what
// was done without extra tables.

import { supabase } from './supabase';
import { TEMPLATE_BY_ID } from '../data/templates';
import { EXERCISE_BY_KEY } from '../data/exercises';

export async function saveYouthSession({ templateId, context, doneKeys, feel, note }) {
  if (!supabase) return { ok: false, error: new Error('No database connection') };

  const template = TEMPLATE_BY_ID[templateId];
  // Flatten the template's exercises in order, tagging which were completed.
  const allKeys = template ? template.blocks.flatMap((b) => b.items) : [...doneKeys];
  const doneSet = new Set(doneKeys);
  const items = allKeys.map((key) => {
    const ex = EXERCISE_BY_KEY[key];
    return {
      key,
      name: ex?.name ?? key,
      pattern: ex?.pattern ?? null,
      done: doneSet.has(key),
    };
  });

  const row = {
    template_id: templateId,
    context,
    title: template?.name ?? 'Workout',
    total: items.length,
    completed: items.filter((i) => i.done).length,
    items,
    feel: feel ?? null,
    note: note?.trim() ? note.trim() : null,
  };

  const { data, error } = await supabase
    .from('youth_sessions')
    .insert(row)
    .select('id')
    .single();

  if (error) return { ok: false, error };
  return { ok: true, id: data.id };
}
