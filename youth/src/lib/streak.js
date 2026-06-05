// Streak + summary stats from a list of youth_sessions rows.

// Local YYYY-MM-DD for a date (not UTC — streaks should follow the kid's day).
function localDay(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function summarize(sessions) {
  const days = new Set(sessions.map((s) => localDay(s.performed_at)));

  // Current streak: consecutive days with a workout, ending today or yesterday.
  const today = new Date();
  let cursor = new Date(today);
  if (!days.has(localDay(cursor))) {
    // No workout today — streak can still be alive if yesterday had one.
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDay(cursor))) {
      return { streak: 0, total: sessions.length, thisWeek: countThisWeek(sessions) };
    }
  }
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak, total: sessions.length, thisWeek: countThisWeek(sessions) };
}

function countThisWeek(sessions) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6); // today + previous 6 days
  cutoff.setHours(0, 0, 0, 0);
  const seen = new Set();
  for (const s of sessions) {
    const d = new Date(s.performed_at);
    if (d >= cutoff) seen.add(localDay(s.performed_at));
  }
  return seen.size;
}
