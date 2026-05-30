import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// push-biometrics (v5) — receives a biometrics snapshot from an iOS Shortcut
// (HRV / resting HR from HealthKit; battery / stress are manual in the app)
// and inserts a soccer_biometrics row. Auth via x-api-key.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

  const apiKey = req.headers.get('x-api-key');
  const expectedKey = Deno.env.get('SHORTCUTS_API_KEY');
  if (expectedKey && apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text);
  } catch { /* empty body ok */ }

  const payload: Record<string, unknown> = {
    recorded_at: new Date().toISOString(),
    source: 'shortcuts',
  };

  // HRV and RHR from HealthKit only — battery and stress are manual in the app
  if (body.hrv_ms != null) {
    const v = Number(body.hrv_ms);
    if (!isNaN(v) && v > 0) payload.hrv_ms = Math.round(v * 10) / 10;
  }
  if (body.rhr_bpm != null) {
    const v = Number(body.rhr_bpm);
    if (!isNaN(v) && v > 0) payload.rhr_bpm = Math.round(v);
  }

  // stress_score: Athlytic scale 0-60
  if (body.stress_score != null) {
    const v = Number(body.stress_score);
    if (!isNaN(v)) payload.stress_score = Math.max(0, Math.min(60, Math.round(v)));
  }

  if (body.notes) payload.notes = String(body.notes).slice(0, 200);

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/soccer_biometrics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    return new Response(JSON.stringify({ error: 'DB insert failed', detail: err }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const inserted = await insertRes.json();
  return new Response(JSON.stringify({ ok: true, data: inserted[0] ?? inserted }), {
    status: 200, headers: { ...cors, 'Content-Type': 'application/json' }
  });
});
