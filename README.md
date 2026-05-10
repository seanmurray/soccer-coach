# Soccer Performance Coach

A mobile-first PWA training coach. Reads morning readiness, picks a training
mode, prescribes the day's workout from a 9-week triphasic cycle, logs every
set, and gives Claude-powered coaching feedback. Personal-use, deployed to
GitHub Pages, backed by Supabase.

The authoritative spec lives in `../Initial Files/SOCCER_APP_SPEC.md`.
The working v9 reference (single-file HTML/JS) lives in
`../Initial Files/soccer_performance_coach_v9.html`.

## Stack

- React 18 + Vite
- Zustand (session + settings state) · React Query (data fetching)
- Supabase (DB + edge functions)
- vite-plugin-pwa (service worker, manifest)
- CSS Modules + design tokens (`src/styles/tokens.css`)

## Getting started

```bash
npm install
cp .env.example .env.local      # edit and paste your anon key
npm run dev
```

Useful scripts:

- `npm run dev` — Vite dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — ESLint
- `npm run gen-icons` — regenerate PWA raster icons from `public/favicon.svg`

## Layout

```
src/
├── App.jsx                 # tab routing
├── main.jsx
├── index.css               # global reset + typography utils
├── styles/tokens.css       # design tokens (colors, radii, motion, fonts)
├── components/             # BottomNav, ReadinessRing, ReadinessSliders, …
├── screens/                # TodayScreen, WorkoutScreen, HistoryScreen, SettingsScreen
├── stores/                 # sessionStore, settingsStore (Zustand)
├── lib/                    # periodization, queryClient, supabase client
└── data/                   # exercises, sessions, modules, frc — extracted from v9
```

## Deployment notes

For GitHub Pages **project pages** (e.g. `username.github.io/soccer-coach/`),
set `VITE_BASE_PATH=/soccer-coach/` in the build environment. For user/org
pages or root deployments, leave it unset.

## What's done in this scaffold

- Project skeleton, deps, build + lint clean
- Design tokens + global typography
- Data files extracted from v9 (exercises, sessions, modules, FRC, warmup,
  mode insights, day type info)
- Periodization helpers (phase, prescription, calcLoad, computeMode, rest time)
- Zustand stores + React Query client + Supabase client
- All 4 screens + BottomNav stubbed and styled
- PWA manifest, service worker, iOS meta tags, raster icons

## What's NOT in this scaffold (next pass)

- Workout builder (exercise blocks, set rows, RPE select, swap/upgrade flow)
- Rest timer (Web Audio + ring countdown)
- AI session cue / debrief via Supabase `claude-proxy` edge function
- Module sheet + telemetry (open/close/duration/exercises checked)
- History rendering from Supabase
- Save Session writes to all 4 `soccer_*` tables
- Conditioning interference banner (spec §14)
- Known data bug: `mod3.lat.build` references `cable_woodchop` which is not
  defined in `EX` — resolve by either adding the exercise or substituting.
