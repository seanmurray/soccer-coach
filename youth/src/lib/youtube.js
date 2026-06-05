// Build a YouTube search URL from a query string. We link to *search* rather
// than a fixed video ID so links never rot — the top result for a good query
// is reliably a solid demo, and creators/uploads can change without breaking
// the app. Tapping opens YouTube (app or web) on the device.
export const ytSearch = (q) =>
  'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
