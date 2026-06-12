import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// youth-notify (v2) — emails the dad when one of the three sibling athletes
// (August / Millie / Evie) hits a milestone in the Young Athlete app: a new
// personal record, a freshly-unlocked badge, or a level-up.
//
// Triggered by Supabase Database Webhooks on INSERT to youth_sessions and
// youth_prs (see migration: create_youth_webhooks). The webhook body carries
// the inserted row, including athlete_id — the function recomputes stats
// scoped to that athlete only, so each kid's badges and level-ups are
// independent. Per-workout emails are intentionally suppressed; only
// celebratory events fire.
//
// Auth: invoked from the database via pg_net with a shared secret in the
// `x-notify-secret` header; rejected otherwise. verify_jwt is off in
// supabase/config.toml so the API gateway doesn't bounce the call.
//
// Secrets (dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   — required.
//   NOTIFY_SECRET    — required. Shared with the DB trigger.
//   NOTIFY_TO_EMAIL  — optional. Defaults to tungsten.sean@gmail.com.
//   NOTIFY_FROM_EMAIL— optional. Defaults to onboarding@resend.dev.

const DEFAULT_TO   = 'tungsten.sean@gmail.com';
const DEFAULT_FROM = 'onboarding@resend.dev';

// ─── Athletes — name + visual identity for emails ───────────────────────────
type Athlete = {
  id: string; name: string; pronoun: string; url: string;
  bg: string; card: string; border: string; accent: string;
  textHeading: string; textBody: string; textMuted: string;
};
const ATHLETES: Record<string, Athlete> = {
  august: {
    id: 'august', name: 'August', pronoun: 'He',
    url:  'https://seanmurray.github.io/soccer-coach/youth/',
    bg: '#0b1220', card: '#131c2e', border: '#1b2740',
    accent: '#3a8dff', textHeading: '#f6f9ff', textBody: '#b3c0d8', textMuted: '#7888a8',
  },
  millie: {
    id: 'millie', name: 'Millie', pronoun: 'She',
    url:  'https://seanmurray.github.io/soccer-coach/millie/',
    bg: '#170a13', card: '#241420', border: '#321b2c',
    accent: '#ff4d9d', textHeading: '#fef5f8', textBody: '#d8b3c2', textMuted: '#a07888',
  },
  evie: {
    id: 'evie', name: 'Evie', pronoun: 'She',
    url:  'https://seanmurray.github.io/soccer-coach/evie/',
    bg: '#110b20', card: '#1f1430', border: '#2a1d40',
    accent: '#b974ff', textHeading: '#f6f0ff', textBody: '#c8b3d8', textMuted: '#8878a8',
  },
};
function athleteOf(id: string | undefined): Athlete {
  return ATHLETES[(id ?? 'august').toLowerCase()] ?? ATHLETES.august;
}

// ─── XP / Levels — kept in lockstep with youth/src/lib/xp.js ────────────────
const XP_PER_MOVE = 10;
const XP_PER_SESSION = 25;
const XP_PER_PR = 20;
const LEVELS = [
  { level: 1, name: 'Rookie',   min: 0 },
  { level: 2, name: 'Starter',  min: 150 },
  { level: 3, name: 'Varsity',  min: 400 },
  { level: 4, name: 'All-Star', min: 800 },
  { level: 5, name: 'Pro',      min: 1400 },
  { level: 6, name: 'Elite',    min: 2200 },
  { level: 7, name: 'Champion', min: 3200 },
  { level: 8, name: 'Legend',   min: 4500 },
];
function levelForXp(xp: number) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) cur = l;
  return cur;
}

// ─── Movement patterns — must match youth/src/data/exercises.js ─────────────
const PATTERN_KEYS = ['move','squat','hinge','push','pull','lunge','core','jump','sprint','throw'];
const TOTAL_PATTERNS = PATTERN_KEYS.length;

// ─── Badges — same definitions as youth/src/lib/badges.js ───────────────────
type BadgeDef = { id: string; emoji: string; label: string; desc: string; target: number; getCurrent: (s: Stats) => number };
type Stats = {
  total: number; homeCount: number; gymCount: number;
  byPattern: Record<string, number>;
  patternsCovered: number;
  prCount: number; streak: number;
};
const BADGES: BadgeDef[] = [
  { id: 'first',       emoji: '🎯', label: 'First Workout', desc: 'Finished their first session',  target: 1,             getCurrent: (s) => s.total },
  { id: 'w10',         emoji: '🔟', label: '10 Workouts',   desc: 'Finished 10 sessions',          target: 10,            getCurrent: (s) => s.total },
  { id: 'w25',         emoji: '🏅', label: '25 Workouts',   desc: 'Finished 25 sessions',          target: 25,            getCurrent: (s) => s.total },
  { id: 'w50',         emoji: '🎖️', label: '50 Workouts',   desc: 'Finished 50 sessions',          target: 50,            getCurrent: (s) => s.total },
  { id: 'streak3',     emoji: '🔥', label: '3-Day Streak',  desc: 'Trained 3 days in a row',       target: 3,             getCurrent: (s) => s.streak },
  { id: 'streak7',     emoji: '🔥', label: 'Week Streak',   desc: 'Trained 7 days in a row',       target: 7,             getCurrent: (s) => s.streak },
  { id: 'streak30',    emoji: '🌋', label: '30-Day Streak', desc: 'Trained 30 days in a row',      target: 30,            getCurrent: (s) => s.streak },
  { id: 'wellrounded', emoji: '🌟', label: 'Well-Rounded',  desc: 'Did a move in every athletic family', target: TOTAL_PATTERNS, getCurrent: (s) => s.patternsCovered },
  { id: 'home',        emoji: '🏠', label: 'Home Hero',     desc: '10 home workouts',              target: 10,            getCurrent: (s) => s.homeCount },
  { id: 'gym',         emoji: '🏋️', label: 'Gym Strong',    desc: '10 gym workouts',               target: 10,            getCurrent: (s) => s.gymCount },
  { id: 'jump',        emoji: '⬆️', label: 'Jump Master',   desc: '25 jump moves',                 target: 25,            getCurrent: (s) => s.byPattern.jump ?? 0 },
  { id: 'speed',       emoji: '⚡', label: 'Speed Demon',   desc: '25 speed moves',                target: 25,            getCurrent: (s) => s.byPattern.sprint ?? 0 },
  { id: 'grip',        emoji: '🧗', label: 'Iron Grip',     desc: '25 pull moves',                 target: 25,            getCurrent: (s) => s.byPattern.pull ?? 0 },
  { id: 'pr1',         emoji: '📈', label: 'Record Breaker', desc: 'Logged their first record',    target: 1,             getCurrent: (s) => s.prCount },
  { id: 'pr5',         emoji: '👑', label: 'Record Hunter',  desc: 'Logged 5 records',             target: 5,             getCurrent: (s) => s.prCount },
];

// ─── Streak (forgiving — one rest day OK; matches youth/src/lib/streak.js) ──
const DAY = 24 * 60 * 60 * 1000;
function localMidnight(d: string | Date) { const dt = new Date(d); dt.setHours(0,0,0,0); return dt; }
function daysBetween(a: Date, b: Date) { return Math.round((localMidnight(a).getTime() - localMidnight(b).getTime()) / DAY); }
function computeStreak(sessions: { performed_at: string }[]) {
  const days = [...new Map(sessions.map(s => { const m = localMidnight(s.performed_at); return [m.getTime(), m]; })).values()].sort((a,b) => b.getTime() - a.getTime());
  if (!days.length) return 0;
  if (daysBetween(new Date(), days[0]) > 2) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (daysBetween(days[i-1], days[i]) <= 2) streak++; else break;
  }
  return streak;
}

// ─── Stats ──────────────────────────────────────────────────────────────────
function buildStats(sessions: any[], prs: any[]): Stats {
  const byPattern: Record<string, number> = {};
  for (const s of sessions) for (const it of (s.items ?? [])) {
    if (!it.done) continue;
    const p = it.pattern;
    if (p) byPattern[p] = (byPattern[p] ?? 0) + 1;
  }
  return {
    total: sessions.length,
    homeCount: sessions.filter(s => s.context === 'home').length,
    gymCount: sessions.filter(s => s.context === 'gym').length,
    byPattern,
    patternsCovered: PATTERN_KEYS.filter(p => (byPattern[p] ?? 0) > 0).length,
    prCount: prs.length,
    streak: computeStreak(sessions),
  };
}
function computeXp(sessions: any[], prs: any[]) {
  let x = 0;
  for (const s of sessions) x += (s.completed ?? 0) * XP_PER_MOVE + XP_PER_SESSION;
  return x + prs.length * XP_PER_PR;
}

// ─── Supabase helpers (service role) — scoped per athlete ───────────────────
async function sb(path: string, init: RequestInit = {}) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key!, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
}
const fetchSessions = async (athleteId: string) =>
  (await sb(`youth_sessions?select=*&athlete_id=eq.${athleteId}&order=performed_at.desc`)).json();
const fetchPrs = async (athleteId: string) =>
  (await sb(`youth_prs?select=*&athlete_id=eq.${athleteId}&order=achieved_at.desc`)).json();
const fetchEarned = async (athleteId: string) =>
  (await sb(`youth_earned_badges?select=badge_id&athlete_id=eq.${athleteId}`)).json();
const insertEarned = async (athleteId: string, ids: string[]) =>
  sb('youth_earned_badges', {
    method: 'POST',
    body: JSON.stringify(ids.map(id => ({ athlete_id: athleteId, badge_id: id }))),
  });

// ─── Email helpers ──────────────────────────────────────────────────────────
function emailShell(a: Athlete, title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:${a.bg};color:${a.textHeading};font-family:-apple-system,sans-serif;">
<div style="max-width:520px;margin:0 auto;background:${a.card};border-radius:18px;padding:28px;border:1px solid ${a.border};">
<div style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:${a.textMuted};font-weight:700;">${a.name}'s Athlete</div>
<h1 style="font-size:28px;margin:8px 0 18px;color:${a.textHeading};">${title}</h1>
${body}
<div style="margin-top:26px;padding-top:18px;border-top:1px solid ${a.border};font-size:13px;color:${a.textMuted};">
<a href="${a.url}" style="color:${a.accent};text-decoration:none;font-weight:600;">Open ${a.name}'s app →</a>
</div></div></body></html>`;
}
async function sendEmail(subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) { console.error('RESEND_API_KEY not set'); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('NOTIFY_FROM_EMAIL') ?? DEFAULT_FROM,
      to:   [Deno.env.get('NOTIFY_TO_EMAIL') ?? DEFAULT_TO],
      subject, html,
    }),
  });
  if (!r.ok) console.error('resend error', r.status, await r.text());
  return r.ok;
}

// ─── Event handlers ─────────────────────────────────────────────────────────
async function handleSessionInsert(row: any) {
  const a = athleteOf(row.athlete_id);
  const [sessions, prs, earned] = await Promise.all([
    fetchSessions(a.id), fetchPrs(a.id), fetchEarned(a.id),
  ]);
  const stats = buildStats(sessions, prs);

  // Detect badges newly earned vs already-notified.
  const alreadyEmailed = new Set((earned ?? []).map((b: any) => b.badge_id));
  const justEarned = BADGES.filter(b => b.getCurrent(stats) >= b.target && !alreadyEmailed.has(b.id));
  if (justEarned.length) {
    await Promise.all(justEarned.map(async (b) => {
      await sendEmail(`${a.name}: 🏅 ${b.label} unlocked!`,
        emailShell(a, `${b.emoji} ${b.label}`,
          `<p style="font-size:17px;line-height:1.55;color:${a.textBody};">${a.name} just unlocked the <strong style="color:${a.accent};">${b.label}</strong> badge.</p>
<p style="font-size:16px;color:${a.textBody};">${b.desc}.</p>
<p style="font-size:15px;color:${a.textMuted};margin-top:16px;">${stats.total} total workouts · ${stats.streak}-day streak</p>`));
    }));
    await insertEarned(a.id, justEarned.map(b => b.id));
  }

  // Level-up: compare XP before vs after this session.
  const xpAfter  = computeXp(sessions, prs);
  const xpBefore = xpAfter - ((row.completed ?? 0) * XP_PER_MOVE + XP_PER_SESSION);
  const before   = levelForXp(xpBefore);
  const after    = levelForXp(xpAfter);
  if (after.level > before.level) {
    await sendEmail(`${a.name}: 🚀 Leveled up — ${after.name}!`,
      emailShell(a, `🚀 Level ${after.level}: ${after.name}`,
        `<p style="font-size:17px;line-height:1.55;color:${a.textBody};">${a.name} just leveled up from <strong>${before.name}</strong> to <strong style="color:${a.accent};">${after.name}</strong>.</p>
<p style="font-size:15px;color:${a.textMuted};margin-top:14px;">${xpAfter.toLocaleString()} XP total.</p>`));
  }
}

async function handlePrInsert(row: any) {
  const a = athleteOf(row.athlete_id);
  const all = await fetchPrs(a.id);
  const sameKey = (all ?? []).filter((r: any) => r.exercise_key === row.exercise_key && r.id !== row.id);
  const prevBest = sameKey.length ? Math.max(...sameKey.map((r: any) => Number(r.value))) : null;
  const value = Number(row.value);
  const isFirst = prevBest === null;
  const isRecord = !isFirst && value > prevBest;
  if (isFirst || isRecord) {
    const unit = row.unit ?? '';
    const moveName = row.exercise_key.replace(/_/g, ' ');
    const newLine = isFirst
      ? `<p style="font-size:17px;color:${a.textBody};line-height:1.55;">First record for <strong>${moveName}</strong>: <strong style="color:#ffc83d;font-size:22px;">${value}${unit}</strong>.</p>`
      : `<p style="font-size:17px;color:${a.textBody};line-height:1.55;">New best on <strong>${moveName}</strong>: <strong style="color:#ffc83d;font-size:22px;">${value}${unit}</strong> (was ${prevBest}${unit}, +${(value - (prevBest as number)).toFixed(1)}${unit}).</p>`;
    await sendEmail(
      `${a.name}: ${isFirst ? '🏅 First record set!' : '🎉 New personal record!'}`,
      emailShell(a, isFirst ? '🏅 First record!' : '🎉 NEW RECORD!', newLine)
    );
  }

  // PR may also unlock PR-related badges (Record Breaker / Record Hunter).
  const [sessions, earned] = await Promise.all([fetchSessions(a.id), fetchEarned(a.id)]);
  const stats = buildStats(sessions, all);
  const alreadyEmailed = new Set((earned ?? []).map((b: any) => b.badge_id));
  const justEarned = BADGES.filter(b => b.getCurrent(stats) >= b.target && !alreadyEmailed.has(b.id));
  if (justEarned.length) {
    await Promise.all(justEarned.map(async (b) => {
      await sendEmail(`${a.name}: 🏅 ${b.label} unlocked!`,
        emailShell(a, `${b.emoji} ${b.label}`,
          `<p style="font-size:17px;color:${a.textBody};line-height:1.55;">${a.name} just unlocked <strong style="color:${a.accent};">${b.label}</strong>: ${b.desc}.</p>`));
    }));
    await insertEarned(a.id, justEarned.map(b => b.id));
  }
}

// ─── HTTP entry point ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('NOTIFY_SECRET');
  if (!secret || req.headers.get('x-notify-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    if (body.type !== 'INSERT') return new Response('ok (ignored)', { status: 200 });
    if (body.table === 'youth_sessions') await handleSessionInsert(body.record);
    else if (body.table === 'youth_prs') await handlePrInsert(body.record);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('youth-notify error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
