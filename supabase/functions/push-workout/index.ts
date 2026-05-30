import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// push-workout (v11) — receives a workout summary from an iOS Shortcut reading
// HealthKit and inserts a soccer_workouts row. Auth via x-api-key. Idempotent
// on (source, source_id).
//
// AUTO-LINK: binds the workout to a same-day soccer_session via session_id.
//
// RICH HR ANALYSIS: the Shortcut sends every HR sample it can grab
// (hr_values/hr_dates parallel lists, either naming). From those we compute,
// server-side where it's testable, EVERYTHING strictly within the workout
// window [started_at, ended_at]:
//   - avg/max HR  (windowed samples are the source of truth — see note below)
//   - hr_hist: an integer-bpm histogram of seconds at each HR. Zone-time is
//     derived CLIENT-SIDE from this against the current calibrated HRmax/RHR
//     (Karvonen). This function contains NO zone thresholds / NO HRmax calc.
//   - 1-minute heart-rate recovery (HRR), referenced to the effort HR at
//     cessation, gated to real efforts.
//
// WHY WE OVERRIDE HEALTHKIT avg/max (v11): HealthKit's own avg/max (and the
// Shortcut's Calculate-Statistics over a loosely-bounded sample set) are NOT
// clamped to [started_at, ended_at] — pre/post-workout readings leak in.
// Observed: a sit-down "walk" stored max_hr 111 while its in-window samples
// peaked at 96. So whenever we have in-window samples we recompute avg/max
// from them; the client-supplied values are used only as a fallback when no
// samples are sent.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

// Derive a LOCAL calendar date from an ISO timestamp. NOTE: this relies on the
// Shortcut sending a local-offset ISO string (e.g. ...-05:00). If it ever
// sends a UTC 'Z' string, an evening workout would roll to the next day — the
// Shortcut doc calls this requirement out explicitly.
const toLocalDate = (iso: unknown): string | null => {
  if (!iso || typeof iso !== 'string') return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
};

const numOrNull = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const intOrNull = (v: unknown): number | null => {
  const n = numOrNull(v);
  return n == null ? null : Math.round(n);
};

const WORKOUT_TYPE_EXACT: Record<string, string> = {
  'traditional strength training': 'strength',
  'functional strength training': 'strength',
  'core training': 'strength',
  'strength training': 'strength',
  'high intensity interval training': 'hiit',
  'indoor cycling': 'cycling',
  'outdoor cycling': 'cycling',
  'indoor run': 'running',
  'outdoor run': 'running',
  'indoor walk': 'walking',
  'outdoor walk': 'walking',
  'pool swim': 'swimming',
  'open water swim': 'swimming',
};
function normalizeWorkoutType(input: unknown): string | null {
  if (typeof input !== 'string' || input.trim() === '') return null;
  const s = input.trim().toLowerCase();
  if (WORKOUT_TYPE_EXACT[s]) return WORKOUT_TYPE_EXACT[s];
  if (s.includes('strength')) return 'strength';
  if (s.includes('interval') || s === 'hiit') return 'hiit';
  if (s.includes('treadmill')) return 'treadmill';
  if (s.includes('elliptical')) return 'elliptical';
  if (s.includes('row')) return 'rowing';
  if (s.includes('cycl') || s.includes('bike')) return 'cycling';
  if (s.includes('run')) return 'running';
  if (s.includes('walk') || s.includes('hik')) return 'walking';
  if (s.includes('yoga')) return 'yoga';
  if (s.includes('swim')) return 'swimming';
  return s;
}

function parseList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter((s) => s.length > 0);
  if (typeof input === 'string') {
    return input.split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [];
}

// Parse parallel value/date lists into sorted {t,v} sample pairs.
function toPairs(values: string[], dates: string[]): Array<{ t: number; v: number }> {
  const n = Math.min(values.length, dates.length);
  const out: Array<{ t: number; v: number }> = [];
  for (let i = 0; i < n; i++) {
    const t = new Date(dates[i]).getTime();
    const v = Number(values[i]);
    if (Number.isFinite(t) && Number.isFinite(v) && v > 0) out.push({ t, v });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

// Integer-bpm histogram of seconds-at-HR over the in-window samples. Gap-based:
// attribute the time until the next sample to the current sample's bpm, capping
// each gap at 30s so a missed-sample gap doesn't inflate a bucket. Last sample
// gets a 5s tail (typical workout cadence). NO zone logic — binning into zones
// happens client-side against the current calibrated HRmax/RHR.
function histInWindow(windowPairs: Array<{ t: number; v: number }>): Record<string, number> | null {
  if (windowPairs.length === 0) return null;
  const CAP = 30000;
  const ms: Record<number, number> = {};
  for (let i = 0; i < windowPairs.length; i++) {
    let dt = i < windowPairs.length - 1 ? windowPairs[i + 1].t - windowPairs[i].t : 5000;
    if (!Number.isFinite(dt) || dt <= 0) dt = 5000;
    if (dt > CAP) dt = CAP;
    const bpm = Math.round(windowPairs[i].v);
    ms[bpm] = (ms[bpm] ?? 0) + dt;
  }
  const hist: Record<string, number> = {};
  for (const k of Object.keys(ms)) {
    const sec = Math.round(ms[Number(k)] / 1000);
    if (sec > 0) hist[k] = sec;
  }
  return Object.keys(hist).length > 0 ? hist : null;
}

// 1-minute HRR. Reference = the effort HR at cessation: the larger of (HR
// closest to end) and (peak HR in the final 120s of the workout) — robust to a
// last sample that already dipped during a brief cooldown. Gated to refHr >=
// 150 so easy/recovery sessions (yoga, walks) don't report a meaningless HRR.
// Recovery HR ~ 60s post-cessation, bracket [end+30s, end+120s]. Null if we
// can't bracket recovery (e.g. watch stopped recording at end).
function hrRecovery(
  allPairs: Array<{ t: number; v: number }>,
  windowPairs: Array<{ t: number; v: number }>,
  endMs: number,
): number | null {
  if (allPairs.length === 0) return null;
  let endHr: number | null = null, endGap = Infinity;
  for (const p of allPairs) {
    if (p.t <= endMs + 5000) {
      const g = Math.abs(p.t - endMs);
      if (g < endGap) { endGap = g; endHr = p.v; }
    }
  }
  let tailPeak = -Infinity;
  for (const p of windowPairs) {
    if (p.t >= endMs - 120000 && p.t <= endMs) tailPeak = Math.max(tailPeak, p.v);
  }
  const refHr = Math.max(endHr ?? -Infinity, tailPeak);
  if (!Number.isFinite(refHr) || refHr < 150) return null;
  const target = endMs + 60000;
  let recHr: number | null = null, recGap = Infinity;
  for (const p of allPairs) {
    if (p.t >= endMs + 30000 && p.t <= endMs + 120000) {
      const g = Math.abs(p.t - target);
      if (g < recGap) { recGap = g; recHr = p.v; }
    }
  }
  if (recHr == null) return null;
  const drop = Math.round(refHr - recHr);
  return drop > 0 ? drop : null;
}

async function findMatchingSessionId(performedAt: string, workoutStartedAt: string | null): Promise<string | null> {
  const url = `${SUPABASE_URL}/rest/v1/soccer_sessions?performed_at=eq.${encodeURIComponent(performedAt)}&select=id,metadata,created_at`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ id: string; metadata?: { session_started_at?: string } | null; created_at?: string }>;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  if (rows.length === 1) return rows[0].id;
  if (!workoutStartedAt) return rows[0].id;
  const wt = new Date(workoutStartedAt).getTime();
  if (!Number.isFinite(wt)) return rows[0].id;
  let bestId = rows[0].id;
  let bestGap = Number.POSITIVE_INFINITY;
  for (const r of rows) {
    const st = r.metadata?.session_started_at ?? r.created_at ?? null;
    if (!st) continue;
    const t = new Date(st).getTime();
    if (!Number.isFinite(t)) continue;
    const gap = Math.abs(t - wt);
    if (gap < bestGap) { bestGap = gap; bestId = r.id; }
  }
  return bestId;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = req.headers.get('x-api-key');
  const expectedKey = Deno.env.get('SHORTCUTS_API_KEY');
  if (expectedKey && apiKey !== expectedKey) return json({ error: 'Unauthorized' }, 401);

  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text);
  } catch (e) {
    return json({ error: 'Invalid JSON', detail: String(e) }, 400);
  }

  const performedAt =
    (typeof body.performed_at === 'string' ? body.performed_at : null) ??
    toLocalDate(body.started_at) ??
    toLocalDate(body.ended_at) ??
    toLocalDate(new Date().toISOString());
  if (!performedAt) return json({ error: 'Missing performed_at / started_at' }, 400);

  const startMs = typeof body.started_at === 'string' ? new Date(body.started_at).getTime() : NaN;
  const endMs = typeof body.ended_at === 'string' ? new Date(body.ended_at).getTime() : NaN;
  const elapsedSec = (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs)
    ? Math.round((endMs - startMs) / 1000)
    : null;

  // Duration: trust HealthKit's value, but if it is wildly inconsistent with
  // the elapsed [start,end] window (e.g. a value sent in MINUTES landing in a
  // SECONDS field, or a units mix-up), prefer the window. A genuinely paused
  // workout keeps its active duration — only gross divergence (>50%) flips.
  let durationSec = intOrNull(body.duration_sec);
  let durationProvided: number | null = null;
  let durationCorrected = false;
  if (durationSec == null) {
    durationSec = elapsedSec;
  } else if (elapsedSec != null && (durationSec < elapsedSec * 0.5 || durationSec > elapsedSec * 1.5)) {
    durationProvided = durationSec;
    durationCorrected = true;
    durationSec = elapsedSec;
  }

  // ---- HR analysis from raw samples ----
  // Client-supplied avg/max are kept ONLY as a fallback (no in-window samples).
  let avgHr = intOrNull(body.avg_hr);
  let maxHr = intOrNull(body.max_hr);
  let hrSampleCount: number | null = null;
  let hrHist: Record<string, number> | null = null;
  let hrrBpm: number | null = null;
  let hrStatsSource = (avgHr != null || maxHr != null) ? 'client' : 'none';

  const allPairs = toPairs(parseList(body.hr_values ?? body.hrValues), parseList(body.hr_dates ?? body.hrDates));

  if (allPairs.length > 0 && Number.isFinite(startMs) && Number.isFinite(endMs)) {
    const windowPairs = allPairs.filter((p) => p.t >= startMs && p.t <= endMs);
    hrSampleCount = windowPairs.length;
    if (windowPairs.length > 0) {
      let sum = 0, mx = -Infinity;
      for (const p of windowPairs) { sum += p.v; if (p.v > mx) mx = p.v; }
      // OVERRIDE: windowed samples are the source of truth for avg/max. This
      // discards any pre/post-workout HR that HealthKit's own summary includes.
      avgHr = Math.round(sum / windowPairs.length);
      maxHr = Math.round(mx);
      hrStatsSource = 'window';
      hrHist = histInWindow(windowPairs);
      hrrBpm = hrRecovery(allPairs, windowPairs, endMs);
    }
  }

  const startedAtRaw = typeof body.started_at === 'string' ? body.started_at : null;
  let sessionId: string | null = null;
  try { sessionId = await findMatchingSessionId(performedAt, startedAtRaw); } catch (_) { sessionId = null; }

  // Strip the bulky HR arrays from the stored raw blob; keep distilled metrics.
  const rawForStore: Record<string, unknown> = { ...body };
  delete rawForStore.hr_values;
  delete rawForStore.hr_dates;
  delete rawForStore.hrValues;
  delete rawForStore.hrDates;
  if (hrSampleCount != null) rawForStore.hr_sample_count_in_window = hrSampleCount;
  rawForStore.hr_stats_source = hrStatsSource;
  if (hrStatsSource === 'window') {
    if (body.avg_hr != null) rawForStore.client_avg_hr = intOrNull(body.avg_hr);
    if (body.max_hr != null) rawForStore.client_max_hr = intOrNull(body.max_hr);
  }
  if (durationCorrected) {
    rawForStore.duration_provided = durationProvided;
    rawForStore.duration_corrected_to_elapsed = true;
  }

  const payload: Record<string, unknown> = {
    source: typeof body.source === 'string' && body.source.length > 0 ? body.source : 'apple_health',
    source_id: typeof body.source_id === 'string' ? body.source_id : null,
    workout_type: normalizeWorkoutType(body.workout_type),
    performed_at: performedAt,
    started_at: typeof body.started_at === 'string' ? body.started_at : null,
    ended_at: typeof body.ended_at === 'string' ? body.ended_at : null,
    duration_sec: durationSec,
    distance_mi: numOrNull(body.distance_mi),
    avg_hr: avgHr,
    max_hr: maxHr,
    calories: intOrNull(body.calories),
    hr_hist: hrHist,
    hrr_bpm: hrrBpm,
    session_id: sessionId,
    raw: rawForStore,
  };

  const upsertUrl = `${SUPABASE_URL}/rest/v1/soccer_workouts?on_conflict=source,source_id`;
  const insertRes = await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    return json({ error: 'DB insert failed', detail: err }, 500);
  }

  const inserted = await insertRes.json();
  return json({
    ok: true,
    data: Array.isArray(inserted) ? (inserted[0] ?? inserted) : inserted,
    linked_session_id: sessionId,
    hr_samples_in_window: hrSampleCount,
    hr_stats_source: hrStatsSource,
    hr_hist: hrHist,
    hrr_bpm: hrrBpm,
    duration_corrected: durationCorrected,
  });
});
