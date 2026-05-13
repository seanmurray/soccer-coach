// Persistent per-exercise form-cue notes.
//
// One canonical row per exercise_key in soccer_exercise_notes. We fetch
// ALL notes once (cheap — at most a few dozen rows) and consumers select
// the one they need by key. UPSERT on save.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const KEY = ['soccer_exercise_notes'];

export function useExerciseNotes() {
  return useQuery({
    queryKey: KEY,
    enabled: !!supabase,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('soccer_exercise_notes')
        .select('exercise_key, exercise_name, note, updated_at');
      if (error) throw error;
      const map = {};
      for (const row of data ?? []) map[row.exercise_key] = row;
      return map;
    },
  });
}

// Returns { note, save, isSaving } for a specific exercise key.
export function useExerciseNote(exerciseKey, exerciseName) {
  const queryClient = useQueryClient();
  const { data: notesMap } = useExerciseNotes();
  const note = notesMap?.[exerciseKey]?.note ?? '';

  const mutation = useMutation({
    mutationFn: async (newNote) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase
        .from('soccer_exercise_notes')
        .upsert({
          exercise_key: exerciseKey,
          exercise_name: exerciseName,
          note: newNote,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'exercise_key' });
      if (error) throw error;
      return newNote;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  return { note, save: mutation.mutate, isSaving: mutation.isPending };
}
