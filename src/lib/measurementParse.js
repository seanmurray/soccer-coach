// Parse the encoded measurement out of a soccer_exercise_perf.notes string.
//
// FeedbackBlock writes the structured tags as a bracketed prefix:
//   "[upgrade · 42 in] freeform notes"
//   "[42 in]"
//   "[upgrade]"
//
// This module pulls out the numeric value + unit. Returns null if no
// measurement was logged.

const TAG_RE = /\[([^\]]+)\]/;
const NUMERIC_TAG_RE = /^(\d+(?:\.\d+)?)\s*(in|cm|lbs|kg|sec|s|m|mph|kmh|kph)$/i;

export function parseMeasurement(notes) {
  if (!notes) return null;
  const m = notes.match(TAG_RE);
  if (!m) return null;
  const tags = m[1].split('·').map((s) => s.trim());
  for (const t of tags) {
    if (t === 'upgrade') continue;
    const num = t.match(NUMERIC_TAG_RE);
    if (num) return { value: Number(num[1]), unit: num[2].toLowerCase() };
  }
  return null;
}

export function isUpgrade(notes) {
  if (!notes) return false;
  const m = notes.match(TAG_RE);
  if (!m) return false;
  return m[1].split('·').map((s) => s.trim()).includes('upgrade');
}
