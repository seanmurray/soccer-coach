// Native-only: schedule a local notification for the rest timer's end, so the
// ding fires even when the app is backgrounded or the screen is locked (the
// webview's JS — and with it the WebAudio tone — is suspended there).
//
// On the web this is a complete no-op: the plugin is dynamically imported only
// on native, so the PWA bundle and behavior are unchanged.
//
// The notification is scheduled with silent:true, which the plugin honors only
// for FOREGROUND presentation — in the foreground the in-app tone/clip plays
// and the notification stays invisible; in the background iOS delivers it with
// the system sound. (The user's custom recorded clip can't be the notification
// sound — iOS requires a bundled/on-disk caf/aiff/wav file, not a data URL.)

import { Capacitor } from '@capacitor/core';

const NOTIF_ID = 4207;

let pluginPromise = null;
function getPlugin() {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(null);
  if (!pluginPromise) {
    pluginPromise = import('@capacitor/local-notifications')
      .then((m) => m.LocalNotifications)
      .catch(() => null);
  }
  return pluginPromise;
}

async function ensurePermission(ln) {
  let { display } = await ln.checkPermissions();
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    ({ display } = await ln.requestPermissions());
  }
  return display === 'granted';
}

// Best-effort: any failure (permission denied, plugin missing) just means no
// background ding — the in-app foreground behavior is unaffected.
export async function scheduleRestEndNotification({ endsAt, exerciseName, sound }) {
  const ln = await getPlugin();
  if (!ln) return;
  try {
    if (!(await ensurePermission(ln))) return;
    await ln.cancel({ notifications: [{ id: NOTIF_ID }] });
    if (endsAt - Date.now() < 1000) return; // ends now — in-app path covers it
    await ln.schedule({
      notifications: [{
        id: NOTIF_ID,
        title: 'Rest over',
        body: exerciseName ? `Next set: ${exerciseName}` : 'Time for the next set',
        schedule: { at: new Date(endsAt) },
        sound: sound ? 'default' : undefined,
        silent: true,
      }],
    });
  } catch { /* best-effort */ }
}

export async function cancelRestEndNotification() {
  const ln = await getPlugin();
  if (!ln) return;
  try { await ln.cancel({ notifications: [{ id: NOTIF_ID }] }); } catch { /* ignore */ }
}
