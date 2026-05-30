# iOS Shortcut — push a HealthKit workout into the app

Edge function `push-workout` accepts a workout summary from an iOS Shortcut
and writes a row to `soccer_workouts`. Once configured, this captures Apple
Watch sessions automatically — including Technogym treadmill sessions when
you tap your watch to the console (Apple GymKit) — and surfaces them on
Today.

The Mywellness phone app is **not** required. When the watch is paired to
a Technogym Live/MyRun/Excite/Skillrun console via GymKit, the treadmill's
calibrated speed / distance / incline / heart rate flow through the watch
and land in Apple Health on workout end. The Shortcut just reads from
Apple Health.

Mirrors the existing `push-biometrics` setup — same `x-api-key` auth, same
`SHORTCUTS_API_KEY` env var on the function.

---

## Endpoint

```
POST https://oxvtmmiwgmheudgbvpjp.supabase.co/functions/v1/push-workout
Content-Type: application/json
x-api-key: <SHORTCUTS_API_KEY>
```

The function upserts on `(source, source_id)` — a Shortcut retry won't
duplicate the row.

---

## Payload

| field          | type     | notes                                                                                |
| -------------- | -------- | ------------------------------------------------------------------------------------ |
| `source`       | string   | `'apple_health'` (default), `'mywellness'`, `'shortcut'`, `'manual'`                 |
| `source_id`    | string   | HealthKit UUID — used for dedupe. Omit if unavailable.                               |
| `workout_type` | string   | `running` / `cycling` / `walking` / `treadmill` / `elliptical` / `rowing` / `strength` / `hiit` / `other` |
| `started_at`   | ISO-8601 | Workout start time. Used to derive `performed_at` if not given.                      |
| `ended_at`     | ISO-8601 | Workout end time. Used to derive `duration_sec` if not given.                        |
| `performed_at` | `YYYY-MM-DD` | Local date. Auto-derived from `started_at` if absent.                            |
| `duration_sec` | number   | Auto-derived from start/end if absent.                                               |
| `distance_mi`  | number   | Miles. Distance-based workouts only.                                                 |
| `avg_hr`       | number   | bpm. If omitted, the server computes it from `hr_values`.                            |
| `max_hr`       | number   | bpm. If omitted, the server computes it from `hr_values`.                            |
| `calories`     | number   | kcal (active)                                                                        |
| `hr_values`    | array or CSV | **Raw per-sample HR (bpm).** Required for time-in-zone, the zone bar, calibrated zones, and 1-min HRR. Parallel to `hr_dates`. Omitting it falls back to a single avg-HR estimate. |
| `hr_dates`     | array or CSV | ISO-8601 timestamp for each `hr_values` entry (same order, same length).         |

The whole posted JSON is also stored in `soccer_workouts.raw` so anything
extra you send isn't lost — except the bulky `hr_values` / `hr_dates` arrays,
which are distilled into `hr_hist` (a bpm→seconds histogram), `avg_hr`,
`max_hr`, and `hrr_bpm` and then dropped from the stored blob.

### Example — Apple Watch run

```json
{
  "source": "apple_health",
  "source_id": "F2D3A8C1-...",
  "workout_type": "running",
  "started_at": "2026-05-23T07:12:04-04:00",
  "ended_at":   "2026-05-23T07:37:48-04:00",
  "distance_mi": 2.84,
  "avg_hr": 142,
  "max_hr": 168,
  "calories": 312
}
```

### Example — Technogym treadmill via Apple GymKit (watch tap)

Same payload shape. When the watch is paired to the treadmill via GymKit,
Apple Health records the workout type as whatever the treadmill reports
(usually `running` or `walking`) — distance and pace are the treadmill's
calibrated values, not the watch's estimate. The ingest doesn't care about
exact labels.

---

## Setting up the Shortcut

**Prerequisite: Toolbox Pro.** Apple's built-in Health actions in Shortcuts
**cannot read workout objects** — `Find Health Samples` doesn't list a
Workout data type, and there's no `Get Workouts` / `Get Details of Workout`
action anymore. The workaround is [Toolbox Pro](https://toolboxpro.app/)
(one-time IAP), which adds a `Get Activity Workouts` action that queries
HealthKit for workouts. Once installed, that action shows up under the
Toolbox Pro section in the Shortcuts action picker.

1. **For Technogym treadmills: tap your watch to the console** at the start
   of each session. Apple GymKit pairs the watch and treadmill; on workout
   end, the calibrated treadmill data + watch HR land in Apple Health
   automatically. No Mywellness app, no extra setup. (Most modern
   Technogym consoles — MyRun, Excite, Skillrun, Run Personal — support
   GymKit; look for the small Apple Watch icon on the screen.)

2. **Create the Shortcut.** In the Shortcuts app on iPhone:

   **a. Get Activity Workouts** (Toolbox Pro action). Configuration:
   - **Use Date Range:** ON
   - **Start Date:** today at 00:00. Use `Date` action set to *Start of Day*,
     or *Current Date* with an *Adjust Date* (subtract 1 day) — **don't**
     leave both Start and End as `Current Date`, that's a zero-width range
     and returns nothing.
   - **End Date:** Current Date
   - **Distances:** imperial
   - **Sort By:** Start Date, **Order:** Latest First, **Limit:** 1
   - Distance/Temperature units don't affect the payload (we send the
     numeric value either way).

   **b. Extract fields** with `Set Variable` actions. Tap the
   `Activity Workouts` magic variable → drill into properties to pick each:

   | Variable     | From Activity Workouts → |
   |--------------|--------------------------|
   | `sourceId`   | UUID |
   | `workoutType`| Type |
   | `startedAt`  | Start Date |
   | `endedAt`    | End Date |
   | `durationSec`| Duration |
   | `distanceMi` | Distance |
   | `calories`   | Active Energy |

   **c. Normalize.** Two cleanup steps that bit me on first run:
   - **Lowercase the type.** `Change Case` action → `Lowercase`, input
     `workoutType`, store back into `workoutType`. The edge function does
     this defensively too, but cleaner to send it normalized.
   - **ISO 8601 the dates.** `Format Date` action → `ISO 8601`, input
     `startedAt`, store back into `startedAt`. Same for `endedAt`. The
     default Shortcuts date is human-readable ("May 23, 2026 at 11:36 AM")
     which the function rejects.

   **d. Heart rate — send the raw samples, not just avg/max.** `Get Activity
   Workouts` doesn't expose HR, so query the samples separately. The rich
   analysis (time-in-zone bar, calibrated zones, 1-min HRR) is computed
   server-side **from the raw sample arrays** — if you only send avg/max, you
   get a single zone estimate and no zone bar / HRR.
   - `Find Health Samples` → **Heart Rate**, between `startedAt` and
     `endedAt`, sorted by **Start Date**. Store the result as `hrSamples`.
   - Build the two parallel arrays from `hrSamples`:
     - `hr_values`: map each sample → its **Value** (bpm).
     - `hr_dates`: map each sample → its **Start Date**, **ISO 8601**
       formatted. Both must be the same length and order.
     - In Shortcuts: a `Repeat with Each` over `hrSamples` adding to two
       text variables (one value, one ISO date per line) is the simplest
       way; the server accepts newline- or comma-separated lists as well as
       JSON arrays.
   - (Optional, cheap) Also send `avg_hr` / `max_hr` via
     `Calculate Statistics` → **Average** / **Maximum** → `Round`. The server
     prefers these HealthKit summary values and only falls back to computing
     them from `hr_values` when they're absent. The zone bar / HRR always
     come from the raw samples.

   **e. POST it.** `Get Contents of URL`:
   - URL: `https://oxvtmmiwgmheudgbvpjp.supabase.co/functions/v1/push-workout`
   - Method: `POST`
   - Headers:
     - `Content-Type: application/json`
     - `x-api-key: <your SHORTCUTS_API_KEY>`
   - Request Body type: **JSON**
   - Fields — **type the key as plain text on the left, insert the magic
     variable on the right**. (Easy mistake: dropping the variable into
     the key field instead of the value field. Then your data becomes the
     JSON keys and every value is empty.)
     ```
     source        : apple_health         ← plain text literal
     source_id     : <sourceId>
     workout_type  : <workoutType>
     started_at    : <startedAt>
     ended_at      : <endedAt>
     duration_sec  : <durationSec>
     distance_mi   : <distanceMi>
     avg_hr        : <avgHr>              ← optional; server can derive it
     max_hr        : <maxHr>              ← optional; server can derive it
     hr_values     : <hrValues>           ← raw bpm samples (enables zones/HRR)
     hr_dates      : <hrDates>            ← ISO timestamps, parallel to hr_values
     calories      : <calories>
     ```

3. **Automate it.** In Shortcuts → Automation → Create Personal Automation
   → **Workout** → "When ending a workout" → "Run Immediately". Run the
   Shortcut you just built.

---

## What if I don't have my watch / GymKit isn't an option?

A few fallbacks, none of which are wired up by default:

- **Mywellness Cloud API (server-side)** — Technogym exposes a Cloud API
  for workout history (OAuth2, requires developer credentials). Would be
  built as a separate `fetch-mywellness` edge function on a cron schedule.
  More moving parts, but doesn't need the watch or any phone app.
- **CSV import from the Mywellness web UI** — if you can export workout
  history from the desktop site, a small import path could parse and
  insert into `soccer_workouts`.
- **Manual entry** — the conditioning duration field already exists for
  variable-prescription protocols.

Tell me if you want either of the first two and I'll build it.

After the next workout ends, you'll see it on the Today screen in the
**Recent workouts** card within a minute.

---

## Auth key

The function uses the same `SHORTCUTS_API_KEY` env var as `push-biometrics`.
If you already have that Shortcut working, reuse the key — nothing new to
configure.

If you need to confirm or rotate it: Supabase dashboard → Project Settings
→ Edge Functions → Secrets.

---

## Troubleshooting

- **"Network connection was lost"** — Shortcut never reached the server.
  Almost always a typo in the URL or a malformed JSON body (e.g. magic
  variables in the key field instead of the value field). Compare against
  Supabase logs (`mcp__supabase__get_logs` service: `edge-function`) —
  if no POST shows up, it died client-side.
- **500 "DB insert failed" with code 42P10** — `ON CONFLICT` target
  missing. The function upserts on `(source, source_id)` and needs a
  non-partial `UNIQUE` constraint on those columns:
  ```sql
  ALTER TABLE public.soccer_workouts
    ADD CONSTRAINT soccer_workouts_source_dedupe UNIQUE (source, source_id);
  ```
  A *partial* unique index (`WHERE source_id IS NOT NULL`) won't satisfy
  PostgREST — it has to be a plain unique constraint.
- **Row inserted but every column is NULL** — magic variables landed in
  the JSON **key** field instead of **value** field. Inspect
  `soccer_workouts.raw` — if you see `"running": ""` or `"May 23, 2026 at
  11:36 AM": ""`, that's what happened. Fix the Shortcut field mapping.
- **`ended_at` (or any other field) NULL despite being sent** — typo in
  the JSON key. Check `soccer_workouts.raw` for misspelled keys like
  `emded_at`. The function only maps known keys; unknown ones land in
  `raw` and get dropped.
- **`Get Activity Workouts` returns nothing** — date range issue. Default
  config with both Start Date and End Date set to `Current Date` is a
  zero-width range. Set Start Date to start-of-day (or `Current Date - 1
  day`).
- **401 Unauthorized** — `x-api-key` header is missing or doesn't match
  `SHORTCUTS_API_KEY`.
- **400 Missing performed_at / started_at** — Shortcut didn't include
  either. Make sure the `started_at` magic variable is wired up.
- **Workout doesn't appear on Today** — query has a 60s stale time; pull
  to refresh or just wait. Confirm the row landed via Supabase Studio:
  `SELECT * FROM soccer_workouts ORDER BY created_at DESC LIMIT 5;`
- **Duplicate rows** — only happens if `source_id` is missing (no dedupe
  key). Make sure the workout UUID is included.
