// Per-athlete identity, theme, and copy. Selected at build time by
// VITE_ATHLETE (seamus | millie | evie) so each sibling app ships as its
// own PWA with its own colors, name, and isolated data.
//
// CI builds the youth source three times with different VITE_ATHLETE +
// VITE_BASE_PATH values, producing dist/youth/, dist/millie/, dist/evie/.
// Local dev defaults to 'seamus' so `npm run dev` keeps working.

const ATHLETES = {
  seamus: {
    id: 'seamus',
    name: 'Seamus',
    short: 'Athlete',
    theme: 'seamus',
    appName: 'Young Athlete',
    appShort: 'Athlete',
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

const envId = (import.meta.env.VITE_ATHLETE ?? 'seamus').toLowerCase();
export const ATHLETE = ATHLETES[envId] ?? ATHLETES.seamus;
export const ALL_ATHLETES = ATHLETES;
