// Thin client for the `claude-proxy` Supabase edge function.
//
// The function is a permissive pass-through to the Anthropic Messages API:
//   POST /functions/v1/claude-proxy
//   body: { model?, max_tokens?, messages: [...] }
//   returns: raw Messages API response
//
// We send only the Authorization: Bearer header. The edge function CORS
// allow-list is `Content-Type, Authorization` — adding `apikey` triggers a
// preflight rejection. The proxy itself uses ANTHROPIC_API_KEY from its
// secrets, not anything off the request, so the bearer token is informational
// only (and `verify_jwt: false` means Supabase doesn't validate it).
//
// Spec §13 originally pinned the model to `claude-sonnet-4-20250514` (May
// 2025). We override to `claude-sonnet-4-6` — the current most-capable
// Sonnet alias. The proxy itself is unchanged; the override travels in the
// request body.

const DEFAULT_MODEL = 'claude-sonnet-4-6';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/claude-proxy` : null;

// Run a Messages API request. Returns the assistant's joined text content,
// or throws an Error with a useful message.
//
// 30-second timeout via AbortController — if a service worker or proxy ever
// silently swallows the request, we'll fail loud instead of hanging.
export async function askClaude({
  system,
  messages,
  maxTokens = 300,
  model = DEFAULT_MODEL,
  timeoutMs = 30000,
}) {
  if (!ENDPOINT || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured — cannot reach claude-proxy.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      // Bypass the service-worker cache entirely — we never want a stale
      // edge-function response served from a previous build's SW.
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        // Anthropic's Messages API: `system` is a top-level field, not a role.
        ...(system ? { system } : {}),
        messages,
      }),
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(
        `claude-proxy timed out after ${timeoutMs}ms (likely service worker intercept — unregister SW for localhost)`,
        { cause: err }
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error ?? ''; } catch { /* ignore */ }
    throw new Error(`claude-proxy ${res.status}${detail ? `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
  }

  const data = await res.json();
  // Anthropic Messages response: { content: [{ type: 'text', text: '...' }, ...] }
  // The proxy might also pass back an error object on Anthropic-side failures.
  if (data?.error) {
    throw new Error(`Anthropic error: ${data.error.message ?? JSON.stringify(data.error)}`);
  }
  const text = (data?.content ?? [])
    .filter((b) => b?.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('claude-proxy returned no text');
  return text;
}
