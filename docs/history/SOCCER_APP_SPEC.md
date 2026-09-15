# Soccer Performance Coach — Full Project Specification
*For use as the authoritative reference when rebuilding as a React PWA*

---

## 1. Project Overview

A mobile-first Progressive Web App for a 44-year-old competitive indoor soccer player. The app functions as a daily training coach: it reads morning readiness inputs, determines a training mode, prescribes the day's workout from a periodized program, logs every set and exercise, and gives AI coaching feedback powered by Claude. All data persists to Supabase.

**Target platform:** iPhone (Safari PWA, add to home screen). Must feel like a native app — no browser chrome, safe area insets respected, iOS spring animations, minimum 44px touch targets.

**Current working version:** `soccer_performance_coach_v9.html` — single-file HTML/CSS/JS. This spec describes the rebuild as a proper React PWA.

---

## 2. Tech Stack (Rebuild Target)

- **Framework:** React 18 + Vite
- **Language:** JavaScript (no TypeScript required, but types via JSDoc are welcome)
- **Styling:** Tailwind CSS or CSS Modules — match the existing design tokens exactly
- **State:** Zustand (global store) for session state, React Query for Supabase data fetching
- **Backend:** Supabase (existing project — schema already live)
- **AI:** Claude API via existing Supabase edge function `claude-proxy`
- **Deployment:** GitHub Pages (Vite static build)
- **PWA:** vite-plugin-pwa with service worker for offline support

---

## 3. Design System

### Fonts
```
'Bebas Neue'     — display headings, exercise names, numbers, day labels
'DM Sans'        — body copy, labels, descriptions
'DM Mono'        — all numeric data (loads, RPE, targets, HRV)
```
Load from Google Fonts.

### Color Tokens
```css
--bg:           #0a0a0a    /* true black — OLED */
--bg-card:      #141414
--bg-raised:    #1c1c1e
--bg-input:     #242426
--bg-pill:      #2c2c2e
--t1:           #f5f5f5    /* primary text */
--t2:           #adadad    /* secondary text */
--t3:           #636366    /* tertiary / labels */
--t4:           #3a3a3c    /* borders */
--green:        #30d158    /* iOS system green — primary accent */
--green-bg:     rgba(48,209,88,.12)
--green-line:   rgba(48,209,88,.3)
--amber:        #ffd60a
--amber-bg:     rgba(255,214,10,.1)
--red:          #ff453a
--red-bg:       rgba(255,69,58,.1)
--blue:         #0a84ff
--purple:       #bf5af2
--purple-bg:    rgba(191,90,242,.1)
--purple-line:  rgba(191,90,242,.25)
```

### Radii
```css
--r1: 10px   --r2: 14px   --r3: 18px   --r4: 24px
```

### Touch Targets
Minimum 44px height for any interactive element. Prefer 52px for primary actions.

### Typography Scale (minimum sizes — never go below these)
```
Display (Bebas Neue): 42px, 36px, 28px, 24px, 22px, 20px, 18px
Body (DM Sans):       18px body, 17px labels, 15px secondary
Mono (DM Mono):       18px data, 15px secondary data
Overlines/badges:     17px (was 11px × 1.5 = 17px minimum)
```

### Animation
iOS spring curve: `cubic-bezier(.34,1.56,.64,1)` for interactive elements (day pills, done buttons).
Sheet slide: `cubic-bezier(.16,1,.3,1)` for bottom sheets.
Screen transitions: `fadeUp` — opacity 0→1, translateY 8px→0, 220ms.

---

## 4. App Structure (Screens)

### Bottom Navigation (always visible)
4 tabs: **Today | Workout | History | Settings**
- Fixed to bottom, respects safe area inset bottom
- Backdrop blur: `rgba(14,14,14,.92)` + `backdrop-filter: blur(20px)`
- Active tab color: `--green`

### Screen: Today
1. Date overline + "Today" title + week/phase display in header
2. **Readiness rings** — 2-column grid, Recovery (green ring) + Sleep (purple ring), 100px SVG rings, circumference 251 (r=40)
3. **Mode banner** — full-width colored card showing current training mode
4. **Readiness sliders** — 6 rows: Recovery, Sleep, Body feel, Motivation, Battery (Athlytic 0-100), Stress (Athlytic 0-60). Each row: label | − button | range input | + button | value display
5. **Day selector** — horizontal scrollable pill row
6. **Module row** — horizontal scrollable pill row (below day selector)
7. **AI insight card** — green left-border card, updates when readiness changes
8. **Start Session CTA** — full-width green button

### Screen: Workout
1. Exercise title + session subtitle in header
2. **Tab bar** — pill-style tabs: Warm-up | Agility | Plyometrics | Strength | Build/Trunk (or Warm-up | Conditioning for cond day)
3. Tab content (see Section 6)
4. AI session cue card
5. Finish Session CTA

### Screen: History
- Card list of past sessions (date, mode badge, day type, week, recovery%, RPE)
- Each card expandable to show sets and exercise perf

### Screen: Settings
- Working maxes (2-column grid, 4 exercises)
- Session order (reorderable list with up/down arrows)
- Rest timer toggles (auto-start, audio, vibrate)
- Supabase connection (URL + key inputs, test button)

### Module Sheet (bottom sheet overlay)
- Slides up from bottom, 90% screen height max, draggable handle
- Blur overlay behind it
- Title + subtitle in header, close button
- Scrollable content area

### Rest Timer (floating card)
- Positioned above bottom nav
- Slides up when a set is marked done
- Ring arc countdown, −15/+15 buttons, skip button

---

## 5. Readiness System

### Composite Score Formula

**When Battery and Stress are set (always — they're manual sliders):**
```
score = (battery × 0.28) + (stressInv × 0.12) + (rec × 0.25) + (slp × 0.18) + (body/5 × 10) + (mot/5 × 7)
stressInv = max(0, (60 - stress) / 60 × 100)
```

**Five training modes based on score:**
| Score | Mode | Label | Action |
|-------|------|-------|--------|
| ≥72 | `full` | Full Training | All blocks, full volume, full intent |
| 58-71 | `mod1` | Modified — Light | Strength −15%, plyo −1 set |
| 45-57 | `mod2` | Modified — Medium | Strength −25%, plyo −30%, cap RPE 7.5 |
| 30-44 | `mod3` | Modified — Heavy | 55% load, motor pattern only, low-impact plyos |
| <30 | `recovery` | Recovery Day | Active recovery only |

### Mode Banner Colors
- full: green tint
- mod1: light green tint
- mod2: amber tint
- mod3: orange tint (#ff9500)
- recovery: red tint

---

## 6. Training Program

### Day Types (5, reorderable)
| Key | Label | Primary focus |
|-----|-------|---------------|
| `acc` | Acceleration | Sprint starts, horizontal power |
| `lat` | Lateral COD | Change of direction, lateral agility |
| `lin` | Linear Agility | Pro shuttle, L-drill, linear patterns |
| `vel` | Max Velocity | Sprint mechanics, max speed |
| `cond` | Conditioning | Repeat sprint capacity |

### Session Structure (non-cond days)
1. **Warm-up:** OTA Dynamic Warm-Up (13 items with Check All button)
2. **Agility/Speed:** 4-6 drills based on day type
3. **Plyometrics:** 3-5 exercises based on day type + EVA week 4-11
4. **Strength:** 1 main lift (bench press / trap bar DL / Bulgarian split squat) with full triphasic prescription
5. **Build/Trunk:** 3-4 accessory exercises including Lienhard rotation series

### Conditioning Day Structure
1. **Warm-up:** OTA Dynamic Warm-Up
2. **Conditioning:** Pick 1-2 protocols from list (assault bike tabata, curved treadmill, rower 500m repeats, SkiErg, court sprints, bike+sprint combo)
3. **Full FRC block:** Post-conditioning (20 min, Bergles protocol)

### Exercise Sources
- **OTA Soccer Performance System:** Agility drills, OTA warm-up, primary strength prescription
- **EVA (Elite Vertical Academy wks 4-11):** Plyometric library
- **Joey Bergles / FRC / Kinstretch:** Hip/ankle/shoulder mobility, PAILs/RAILs, lower leg stiffness
- **Judd Lienhard / MASS Method:** Cable rotation series (The Grappler, row-to-rotation, press-to-rotation, half-kneeling chop flow), walking DB lunges

### Partner-Free Rule
No exercises requiring a partner. Ball drops, mirror drill, band-piston run (partner-assisted) are all excluded or replaced with solo versions.

### No Med Ball Against Wall
Med ball slams and holds are fine. No throws against wall, no throws for distance or height.

---

## 7. Periodization — 9-Week Triphasic Cycle

Based on Cal Dietz triphasic training + OTA Soccer Performance System.

| Weeks | Phase | Focus | Tempo (bench) | Tempo (trap bar) | Tempo (BSQ) |
|-------|-------|-------|---------------|------------------|-------------|
| 1-2 | Accumulation | Eccentric | [5\|1\|X] @78-82% | [3\|1\|X] @78-82% | [4\|2\|X] @75-78% |
| 3-5 | Transmutation | Isometric | [1\|5\|X] @82-87% | [1\|4\|X] @82-87% | [1\|5\|X] @80-85% |
| 6-8 | Realization | Concentric contrast | [1\|1\|X] @85-88% | [1\|1\|X] @85-88% | [1\|1\|X] @83-86% |
| 9 | Deload | Recovery | [1\|1\|1] @50% | [1\|1\|1] @50% | [1\|1\|1] @50% |

**Realization phase** pairs each strength set with an explosive movement (box jump, broad jump) — contrast method potentiation.

**Mode modifiers applied to prescription:**
- `mod1`: −15% from full prescription (interpolated)
- `mod2`: uses 'modified' prescription block (−25%)
- `mod3`: uses 'recovery' prescription block (50-55%)

### Working Maxes
4 lifts: Trap bar DL, Back squat, Bench press, Bulgarian split squat (per leg). Stored in Supabase and localStorage. Load recommendations = phase % × working max, rounded to nearest 2.5 lbs.

### Intra-Session Load Adaptation
Per-set: actual weight + reps + RPE → adjusts remaining set recommendations.
- RPE gap from target (8): each 1 point = ±5 lbs on remaining sets
- Yellow "adapt note" shows adjustment reason

---

## 8. FRC / Mobility System

### Short Pre-Session Block (5 items, ~8 min)
Shown in Warm-up tab. Includes: Hip CARs, Ankle CARs, Thoracic CARs, Hip 90/90 PAILs/RAILs, Ankle dorsiflexion PAILs/RAILs.

### Full Post-Conditioning Block (10 items, ~20 min)
Shown at end of conditioning tab. All joints + lower leg stiffness work (Bergles).

### PAILs/RAILs Protocol
Progressive Angular Isometric Loading / Regressive Angular Isometric Loading. The most important mobility method in the program. Every FRC item has a YouTube search link.

---

## 9. Module System

6 standalone modules, accessible from the Today screen module row. Each opens as a bottom sheet.

| ID | Label | Content summary |
|----|-------|-----------------|
| `hip` | Hip Mobility | 90/90 flow, CARs, piriformis, couch stretch, half-kneeling, frog, world's greatest |
| `back` | Back Prehab | McGill Big 3: modified curl-up, side plank, bird dog. 5-3-1 descending pyramid, 8-10 sec holds |
| `knee` | Knee Rehab | 4-phase ACL protocol (Phase 1-4), evidence-based with LSI criteria. Clinical disclaimer required |
| `shoulder` | Shoulder | CARs, sleeper stretch, cross-body stretch, band pull-aparts, wall slides, Y-T-W, ER band |
| `ankle` | Ankle & Lower Leg | Ankle CARs, dorsiflexion PAILs/RAILs, banded distraction, loaded SL calf iso, tibialis wall hold, eccentric SL calf raise, pogo jumps |
| `rotation` | Rotation & Power | Lienhard cable series: The Grappler, row-to-rotation, press-to-rotation, chop flow, walking DB lunges, KB high pull coil |

**Module tracking:** timestamp open/close, duration in seconds, which exercises were checked off.

---

## 10. Rest Timer System

### Auto-starts when set is marked done (configurable)

### Default rest times
| Context | Phase | Seconds |
|---------|-------|---------|
| Strength | Accumulation | 180 |
| Strength | Transmutation | 180 |
| Strength | Realization | 90 (contrast window) |
| Strength | Deload | 90 |
| Build/accessory | any | 90 |
| Plyometrics | any | 60 |

### RPE adjustments to rest time
- RPE ≤6: −30 sec
- RPE 7-7.5: −15 sec
- RPE 8: ±0
- RPE 8.5: +15 sec
- RPE 9: +30 sec
- RPE 9.5-10: +60 sec

### Audio (Web Audio API, no external files)
- Tick on start
- 3 beeps at 5 seconds remaining
- Sustained tone at zero

### Ring arc
Shifts green → amber → red as time runs low.

---

## 11. Detailed Logging System

### What gets saved per session

**Session header** (`soccer_sessions`):
- performed_at, day_type, week_num, mode, phase
- recovery_pct, sleep_pct, body_feel, motivation, battery_pct, stress_score
- session_rpe, energy, ai_debrief

**Per-set strength/build** (`soccer_sets`):
- session_id (FK), performed_at, day_type, week_num
- exercise_key (e.g. 'bench_press'), exercise_name
- set_num, actual_reps, actual_weight (lbs), rpe, rec_weight
- phase, mode

**Per-exercise agility/plyo** (`soccer_exercise_perf`):
- session_id (FK), performed_at, day_type, exercise_key, exercise_name, exercise_type
- quality (1-5), effort_rpe (5-10), ease (1-5), notes
- notes encodes: distance/height measurement if applicable, version (original/upgrade), swap name if used

**Module usage** (`soccer_module_usage`):
- session_id (FK), performed_at, module_id, module_label
- opened_at, closed_at, duration_seconds
- exercises_done (JSONB array), exercises_total

### Ease scale (1-5)
1=Max effort / 2=Hard / 3=Moderate (target) / 4=Easy / 5=Too easy
If ease ≥4 for 3 consecutive sessions on same day type → suggest upgrade variant

### Previous session history
Inline in each exercise block after expansion. Last 3 sessions, format:
"Apr 28 — 4×5 @ 185 lbs, RPE 8"
Loaded async from Supabase on workout build.

### Swap tracking
When user selects a swap variant, the exercise name in all buffered sets updates to "SwapName (swap: OriginalName)". The demo video link also updates to YouTube search for the swap name.

---

## 12. Supabase Schema

**Project ID:** `oxvtmmiwgmheudgbvpjp`
**URL:** `https://oxvtmmiwgmheudgbvpjp.supabase.co`
**Region:** us-west-2

### Tables
```sql
soccer_sessions       -- session headers
soccer_sets           -- per-set strength data
soccer_exercise_perf  -- per-exercise agility/plyo feedback
soccer_module_usage   -- module open/close tracking
soccer_biometrics     -- HealthKit data from iOS Shortcuts (HRV, RHR)
```

### Edge Functions
- `claude-proxy` — proxies requests to Anthropic API, key stored as `ANTHROPIC_API_KEY` secret
- `push-biometrics` — receives HRV + RHR from iOS Shortcuts

### RLS
All tables use anon insert + select policies (no auth required — personal app).

### Key indexes
- `soccer_sets (exercise_key, performed_at desc)` — for history lookups
- `soccer_exercise_perf (exercise_key, day_type, performed_at desc)` — for ease/upgrade checks

---

## 13. AI Integration

**Model:** `claude-sonnet-4-20250514`
**Endpoint:** via `claude-proxy` edge function at `/functions/v1/claude-proxy`

### Session cue (shown at top of workout screen)
Fired on workout start. Prompt: direct coaching cue for today's session based on readiness + phase + day type. 1-2 sentences, starts with the instruction not "Today" or "Focus on".

### Post-session debrief
Fired on Finish Session. Receives:
- Session completion log (tabs visited, sets logged, time in app, warmup items checked)
- All readiness scores
- Post-session RPE + energy

**Honest coach persona:** Does NOT give empty praise. If session was incomplete (zero sets, short duration), calls it out directly. If complete, gives specific actionable feedback.

Completion thresholds:
- 0 sets + <20 min: CRITICAL — session essentially skipped
- <3 sets + <20 min: WARNING — partial session
- Warmup skipped + some blocks untouched: NOTE
- Otherwise: honest assessment, praise only what warrants it

---

## 14. Conditioning Interference Warning

When the user is on a conditioning day AND their previous logged session was Acceleration, Max Velocity, or Linear Agility (all have heavy compound strength work):

Show an orange warning banner at the top of the conditioning tab:
- Explains SBS meta-analysis finding: running-based conditioning creates significant lower body strength interference
- Recommends: assault bike, rower, or SkiErg instead of court sprints

**Last session day type** stored in `localStorage` key `last_session_day_type`.

---

## 15. PWA Requirements

### manifest.json
```json
{
  "name": "Soccer Performance Coach",
  "short_name": "Soccer Coach",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "orientation": "portrait"
}
```

### iOS Meta Tags (required)
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Soccer Coach">
<link rel="apple-touch-icon" href="/icon-192.png">
```

### Service Worker
Cache-first strategy for the app shell (JS, CSS, fonts). Network-first for API calls.

### Viewport
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

Always use `env(safe-area-inset-bottom)` for bottom padding.

---

## 16. Known Bugs (Fixed in v9, watch for regression)

1. **Nested template literals** — never use backtick strings inside `${}` inside another backtick string in JS. Use string concatenation instead.
2. **Function hoisting** — never patch a function by declaring a second version of it. The last declaration wins but `var = fn` assignments capture the wrong version. Always replace the original.
3. **CSS class names in JS** — whenever buildWorkout generates HTML, every CSS class must exist in the stylesheet. v9 had `set-done`, `rpe-sel`, `nav-btn` mismatches.
4. **`sbConnected` gate** — the Supabase save was gated on `S.sbConnected` which could be false on first load. Credentials are baked in; gate only on URL + key presence.
5. **RPE select value** — use `options[selectedIndex].value` not `.value` on iOS Safari for select elements with `-webkit-appearance: none`.
6. **`registerExId` must be called** in both the strength AND build exercise loops in buildWorkout before any set can be saved with the correct exercise key/name.

---

## 17. Component Architecture (React Rebuild)

### Suggested component tree
```
App
├── BottomNav
├── screens/
│   ├── TodayScreen
│   │   ├── ReadinessRings
│   │   ├── ModeBanner
│   │   ├── ReadinessSliders (6 sliders with ± buttons)
│   │   ├── DaySelector
│   │   ├── ModuleRow
│   │   └── AIInsightCard
│   ├── WorkoutScreen
│   │   ├── WorkoutTabBar
│   │   └── tabs/
│   │       ├── WarmupTab
│   │       ├── AgilityTab
│   │       ├── PlyometricsTab
│   │       ├── StrengthTab
│   │       ├── BuildTab
│   │       └── ConditioningTab
│   ├── HistoryScreen
│   └── SettingsScreen
├── components/
│   ├── ExerciseBlock (expandable, with set rows, history, swaps)
│   ├── SetRow (reps input + weight input + rec cell + RPE select + done button)
│   ├── RestTimer (floating)
│   ├── ModuleSheet (bottom sheet)
│   ├── FRCBlock
│   └── PhaseContextBanner
└── stores/
    ├── sessionStore (Zustand — readiness, mode, current workout state)
    └── settingsStore (Zustand — maxes, day order, timer prefs)
```

### Data fetching
Use React Query for:
- `useExerciseHistory(exKey)` — last 3 sessions for a given exercise
- `useSessions()` — history screen
- `useLatestBiometrics()` — HRV/RHR from Shortcuts

### State management
Zustand store holds:
- Readiness inputs (rec, slp, body, mot, battery, stress)
- Derived mode (computed from inputs)
- Current workout state (sets buffer, exercise perf buffer, module usage)
- Settings (maxes, day order, timer prefs)

---

## 18. Quality Checklist (Run Before Every Release)

- [ ] All CSS classes used in JSX exist in stylesheet
- [ ] All onClick handlers reference functions that exist
- [ ] Touch targets: all interactive elements ≥ 44px
- [ ] No text below 15px (post-scaling minimum)
- [ ] Slider values visible without horizontal scroll on 375px viewport
- [ ] Start Session button navigates to workout screen
- [ ] Done button marks set complete, starts timer, buffers set data
- [ ] Save Session writes to all 4 Supabase tables
- [ ] Exercise name in buffered sets matches any active swap selection
- [ ] RPE value is non-null in saved sets
- [ ] Module open/close records duration correctly
- [ ] AI debrief fires and returns text (not "Session logged.")
- [ ] History screen shows correct data from Supabase
- [ ] Warmup Check All checks all items
- [ ] Rest timer audio fires at 5 seconds and zero
- [ ] App installs to iPhone home screen and opens full-screen

---

## 19. Content Reference

The full exercise library (EX dict), SESSIONS structure, MODULE content, WARMUP array, FRC_SHORT, FRC_FULL, MODE_INSIGHTS, and DAY_TYPE_INFO are all in `soccer_performance_coach_v9.html` in the `<script>` block. These should be extracted as:

- `src/data/exercises.js` — EX dict
- `src/data/sessions.js` — SESSIONS + MODE_INSIGHTS
- `src/data/modules.js` — MODULES array with content builders
- `src/data/frc.js` — FRC_SHORT + FRC_FULL + WARMUP

---

## 20. User Profile

- **Age:** 44
- **Sport:** Indoor co-ed soccer (4-8 min bursts, ~1 hr games)
- **Season:** Pre-season (no fixed date)
- **Training frequency:** 5-6 days/week
- **Equipment:** Full commercial gym + home gym (barbell+rack) + basketball court
  - Assault bike, curved treadmill, motorized treadmill, rower, SkiErg, stairclimbers, spin bikes
  - Resistance bands (colors differ from standard — don't reference band colors)
  - Med balls — slams/holds OK, NO throwing for distance/height or against wall
  - Cable machines (uses long woven rope attachment with knotted ends, not standard handles)
- **Goals:** Acceleration, top-end speed, vertical jump, lateral agility, indoor soccer repeat sprint fitness
- **Recovery app:** Athlytic (Apple Watch) — provides Battery (0-100) and Stress (0-60) scores
- **No cold water immersion**

