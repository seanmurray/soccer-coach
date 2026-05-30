# Deploying to GitHub Pages

The repo ships with a GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
that builds the Vite app, sets the right base path, injects the Supabase
secrets, and publishes to GitHub Pages on every push to `main`.

## One-time setup

### 1. Create the GitHub repo

Make a new repo on GitHub (private is fine — Pages works on private repos with
a paid plan; free tier requires public). Don't initialize it with a README —
this directory already has commits.

### 2. Add the remote and push

From this `app/` directory:

```powershell
git remote add origin https://github.com/<your-user>/<repo-name>.git
git branch -M main
git push -u origin main
```

### 3. Enable Pages with "GitHub Actions" as the source

In the GitHub repo:

- Settings → Pages
- Under **Build and deployment**, set **Source** to **GitHub Actions**

Don't pick a branch — the workflow uses the modern Pages deployment, not the
`gh-pages` branch trick.

### 4. Add Supabase secrets

In the GitHub repo:

- Settings → Secrets and variables → Actions → **New repository secret**

Add two secrets (names must match exactly — the workflow reads them):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://hsbtdqxwdcqvhnarujln.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (copy from your local `.env.local`) |

The workflow injects these at build time; they get baked into the JS bundle.
That's fine for the anon key — it's already scoped to RLS-protected operations
and is what would be public anyway.

### 5. Push and wait

```powershell
git push
```

Watch the Actions tab. First build takes ~1-2 min. When it finishes, the
deploy step prints the URL — something like:

```
https://<your-user>.github.io/<repo-name>/
```

## Subsequent deploys

Every push to `main` redeploys automatically. To trigger a deploy manually
without a code change: GitHub repo → Actions → "Deploy to GitHub Pages" →
Run workflow.

## Installing on your iPhone

1. Open the GitHub Pages URL in **Safari** (not Chrome — Chrome's "Add to
   Home Screen" doesn't get the standalone PWA window on iOS).
2. Tap the Share icon → scroll → **Add to Home Screen**.
3. Open from the home screen icon — you'll get the full-screen standalone
   window with the dark status bar, no Safari chrome.

The service worker registers on first load over HTTPS, so the app shell
caches and you can launch it offline once it's installed.

## Troubleshooting

- **Build fails on "VITE_SUPABASE_URL is not defined"** — the secrets aren't
  set, or the names don't match. Re-check step 4.
- **App loads but no data** — the secrets aren't set, or your Supabase RLS
  policies are blocking the anon key. Check the browser console.
- **Service worker won't register** — confirm the URL is HTTPS (it should be,
  GitHub Pages forces it). Open DevTools → Application → Service Workers.
- **Stale build after deploy** — vite-plugin-pwa uses `registerType:
  'autoUpdate'` so the SW should self-replace. If you've added the app to your
  home screen and want to force-refresh, delete it and re-add from Safari, or
  unregister the SW via DevTools.
