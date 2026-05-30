# Supabase Edge Functions

The soccer app's three edge functions, tracked in version control. They run on
the **dedicated** project `sxnmxdezkrmtitjlaokq` (soccer-performance-coach).

| Function          | Purpose                                                        | Auth              | verify_jwt |
| ----------------- | ------------------------------------------------------------- | ----------------- | ---------- |
| `push-workout`    | iOS Shortcut → HealthKit workout → `soccer_workouts` row      | `x-api-key`       | **false**  |
| `push-biometrics` | iOS Shortcut → HRV/RHR → `soccer_biometrics` row              | `x-api-key`       | **false**  |
| `claude-proxy`    | Server-side proxy to the Anthropic API for the AI debrief     | none (server key) | **false**  |

## Secrets (set in the dashboard → Edge Functions → Secrets, NOT the API-keys tab)

These are environment variables read via `Deno.env.get(...)`, not Supabase API
keys. The dashboard "API Keys" tabs (publishable / legacy anon) are unrelated.

| Secret                  | Used by                       | Notes                                              |
| ----------------------- | ----------------------------- | -------------------------------------------------- |
| `SHORTCUTS_API_KEY`     | push-workout, push-biometrics | Shared secret; must match the Shortcuts `x-api-key` header. If unset, auth is **skipped** (functions run open). |
| `ANTHROPIC_API_KEY`     | claude-proxy                  | `sk-ant-…` from console.anthropic.com.             |
| `SUPABASE_URL`          | push-*                        | Auto-injected by the platform.                     |
| `SUPABASE_SERVICE_ROLE_KEY` | push-*                    | Auto-injected by the platform.                     |

## Deploy — automatic via CI (preferred)

`.github/workflows/deploy-functions.yml` deploys all three functions whenever
`supabase/functions/**` or `supabase/config.toml` changes on `main`. **The repo
is the source of truth — edit here and push; don't deploy by hand** (dashboard /
MCP / local CLI) or the live functions drift from git.

One-time setup: add repo secret **`SUPABASE_ACCESS_TOKEN`** (Supabase dashboard
→ Account → Access Tokens → Generate; then GitHub → Settings → Secrets and
variables → Actions → New repository secret). Until it's set, the workflow
fails fast at its guard step.

⚠️ `verify_jwt = false` lives in `config.toml` (single source of truth). A
deploy that defaults it back **on** would 401 every Shortcut POST at the gateway
before the function runs.

## Deploy — manual fallback

```bash
# one-time
supabase link --project-ref sxnmxdezkrmtitjlaokq

# deploy all three (config.toml supplies verify_jwt=false)
supabase functions deploy push-workout push-biometrics claude-proxy
```

## Endpoints

```
POST https://sxnmxdezkrmtitjlaokq.supabase.co/functions/v1/push-workout
POST https://sxnmxdezkrmtitjlaokq.supabase.co/functions/v1/push-biometrics
POST https://sxnmxdezkrmtitjlaokq.supabase.co/functions/v1/claude-proxy
```

The push-* endpoints require header `x-api-key: <SHORTCUTS_API_KEY>`.

## Notes on push-workout HR handling (v11)

- The Shortcut sends raw HR sample arrays (`hr_values` / `hr_dates`). The
  function computes avg/max, an integer-bpm histogram (`hr_hist`), and 1-min
  HRR **strictly within `[started_at, ended_at]`**.
- avg/max are recomputed from in-window samples and **override** any
  client/HealthKit-supplied avg/max, because HealthKit's own summary is not
  clamped to the workout window (pre/post readings leak in — observed a
  sit-down "walk" reporting max_hr 111 while in-window peaked at 96). The
  client values are kept only as a fallback when no samples are sent, and the
  chosen path is recorded in `raw.hr_stats_source`.
- Zone-time is NOT computed here — it's derived client-side from `hr_hist`
  against the current calibrated HRmax/RHR (Karvonen), so recalibration is
  retroactive and there's no edge/app zone-boundary drift.
