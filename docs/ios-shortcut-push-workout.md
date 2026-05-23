# iOS Shortcut — push a HealthKit workout into the app

Edge function `push-workout` accepts a workout summary from an iOS Shortcut
and writes a row to `soccer_workouts`. Once configured, this captures both
Apple Watch sessions and Technogym workouts (via the Mywellness → Apple
Health bridge), and surfaces them on Today.

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
| `avg_hr`       | number   | bpm                                                                                  |
| `max_hr`       | number   | bpm                                                                                  |
| `calories`     | number   | kcal (active)                                                                        |

The whole posted JSON is also stored in `soccer_workouts.raw` so anything
extra you send isn't lost.

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

### Example — Technogym treadmill (via Mywellness → Apple Health bridge)

Same payload shape; just label `workout_type: "treadmill"`. If Mywellness's
Apple Health export writes a generic "running" type, that's fine too — the
ingest doesn't care about exact labels.

---

## Setting up the Shortcut

1. **Enable the Mywellness → Apple Health bridge.**
   - In the Mywellness iOS app: Settings → Apple Health → enable workout
     sync. After this, Technogym treadmill sessions land in Apple Health
     and behave like any other workout.

2. **Create the Shortcut.** In the Shortcuts app on iPhone:

   - **Find Workouts where Date is today** (Health app action) → limit 1, sorted by Start Date descending.
   - **Get Details of Workout** for each of: Type, Start Date, End Date, Duration, Distance, Active Energy, Average Heart Rate, Maximum Heart Rate, UUID.
   - **Get Contents of URL** with:
     - URL: `https://oxvtmmiwgmheudgbvpjp.supabase.co/functions/v1/push-workout`
     - Method: `POST`
     - Headers:
       - `Content-Type: application/json`
       - `x-api-key: <your SHORTCUTS_API_KEY>`
     - Request Body type: JSON
     - Fields (Magic Variable references the matching detail above):
       ```
       source        : apple_health
       source_id     : <UUID>
       workout_type  : <Type, lowercased — use "Change Case to Lowercase">
       started_at    : <Start Date, ISO 8601>
       ended_at      : <End Date, ISO 8601>
       distance_mi   : <Distance in mi>
       avg_hr        : <Average Heart Rate>
       max_hr        : <Maximum Heart Rate>
       calories      : <Active Energy in kcal>
       ```

3. **Automate it.** In Shortcuts → Automation → Create Personal Automation
   → **Workout** → "When ending a workout" → "Run Immediately". Run the
   Shortcut you just built.

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

- **401 Unauthorized** — `x-api-key` header is missing or doesn't match
  `SHORTCUTS_API_KEY`.
- **400 Missing performed_at / started_at** — Shortcut didn't include
  either. Make sure the `started_at` magic variable is wired up.
- **Workout doesn't appear on Today** — query has a 60s stale time; pull
  to refresh or just wait. Confirm the row landed via Supabase Studio:
  `SELECT * FROM soccer_workouts ORDER BY created_at DESC LIMIT 5;`
- **Duplicate rows** — only happens if `source_id` is missing (no dedupe
  key). Make sure the workout UUID is included.
