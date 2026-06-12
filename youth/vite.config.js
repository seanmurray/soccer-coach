import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Young Athlete app — three sibling builds (Seamus / Millie / Evie) share
// this source. Each ships under its own GitHub Pages sub-route with its own
// theme + PWA identity. The athlete is picked by VITE_ATHLETE at build time.
//
// `base` comes from VITE_BASE_PATH so the deploy workflow can set the
// per-athlete path (/soccer-coach/youth/, /soccer-coach/millie/,
// /soccer-coach/evie/). Local dev defaults to "/".

const ATHLETE_MANIFEST = {
  seamus: {
    name: 'Young Athlete',
    short_name: 'Athlete',
    description: 'Build real athleticism — strength, speed, jumps, and movement skill, with video for every exercise.',
    background_color: '#0b1220',
    theme_color: '#0b1220',
  },
  millie: {
    name: "Millie's Athlete",
    short_name: 'Millie',
    description: "Millie's training: get strong, move well, log every record.",
    background_color: '#170a13',
    theme_color: '#170a13',
  },
  evie: {
    name: "Evie's Athlete",
    short_name: 'Evie',
    description: "Evie's training: get strong, move well, log every record.",
    background_color: '#110b20',
    theme_color: '#110b20',
  },
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/';
  const athlete = (env.VITE_ATHLETE || 'seamus').toLowerCase();
  const m = ATHLETE_MANIFEST[athlete] ?? ATHLETE_MANIFEST.seamus;

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: m.name,
          short_name: m.short_name,
          description: m.description,
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: m.background_color,
          theme_color: m.theme_color,
          orientation: 'portrait',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          navigateFallback: 'index.html',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.supabase\.co\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    server: {
      host: true,
    },
  };
});
