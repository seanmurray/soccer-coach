// Per-athlete identity, theme, and copy. Selected at build time by
// VITE_ATHLETE (august | millie | evie) so each sibling app ships as its
// own PWA with its own colors, name, and isolated data.
//
// CI builds the youth source three times with different VITE_ATHLETE +
// VITE_BASE_PATH values, producing dist/youth/, dist/millie/, dist/evie/.
// August's app stays at /youth/ for historical PWA-install continuity even
// though his id and copy now use his real name.
// Local dev defaults to 'august' so `npm run dev` keeps working.

const ATHLETES = {
  august: {
    id: 'august',
    name: 'August',
    short: 'August',
    theme: 'august',
    appName: "August's Athlete",
    appShort: 'August',
    themeColor: '#0b1220',
    accentColor: '#3a8dff',
  },
  millie: {
    id: 'millie',
    name: 'Millie',
    short: 'Millie',
    theme: 'millie',
    appName: 'Millie’s Athlete',
    appShort: 'Millie',
    themeColor: '#1a0d18',
    accentColor: '#ff4d9d',
  },
  evie: {
    id: 'evie',
    name: 'Evie',
    short: 'Evie',
    theme: 'evie',
    appName: 'Evie’s Athlete',
    appShort: 'Evie',
    themeColor: '#110b20',
    accentColor: '#b974ff',
  },
};

const envId = (import.meta.env.VITE_ATHLETE ?? 'august').toLowerCase();
export const ATHLETE = ATHLETES[envId] ?? ATHLETES.august;
export const ALL_ATHLETES = ATHLETES;
