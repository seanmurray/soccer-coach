// Tracks debrief state per session id during the current browser session.
//
// pending: Set<id>     — request in flight; History shows a spinner.
// errors:  { id: msg } — last error message; History shows an error + retry.
//
// Cleared automatically on success (the result lands on the row itself).
// Persists in memory only — a page reload starts fresh.

import { create } from 'zustand';

export const useDebriefStore = create((set, get) => ({
  pending: new Set(),
  errors: {},

  markPending: (id) => {
    if (!id) return;
    const next = new Set(get().pending);
    next.add(id);
    const errs = { ...get().errors };
    delete errs[id];
    set({ pending: next, errors: errs });
  },

  markDone: (id) => {
    const cur = get().pending;
    if (!cur.has(id)) return;
    const next = new Set(cur);
    next.delete(id);
    set({ pending: next });
  },

  markError: (id, message) => {
    if (!id) return;
    set({ errors: { ...get().errors, [id]: message } });
  },

  clearError: (id) => {
    if (!id || !(id in get().errors)) return;
    const next = { ...get().errors };
    delete next[id];
    set({ errors: next });
  },

  isPending: (id) => get().pending.has(id),
  errorFor:  (id) => get().errors[id] ?? null,
}));
