// Rest timer store. Owns: visible flag, end timestamp, exercise context, the
// active interval handle, and the audio graph. Pure state; the RestTimer
// component reads it and drives the SVG ring + button row.

import { create } from 'zustand';
import { getRestTime } from '../lib/periodization';
import { useSettingsStore } from './settingsStore';

let intervalId = null;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.18) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

const audio = {
  tick:  () => playTone(880, 0.08, 'sine', 0.08),
  beep:  () => playTone(880, 0.16, 'sine', 0.20),
  end:   () => playTone(523, 0.6,  'sine', 0.25),
};

export const useRestTimer = create((set, get) => ({
  visible: false,
  exerciseName: '',
  total: 0,        // total seconds for this rest period
  remaining: 0,
  rpeNote: '',     // human-readable adjustment hint, e.g. "+15 sec from RPE 8.5"

  start: ({ exerciseName, context, week, rpe }) => {
    const prefs = useSettingsStore.getState().timerPrefs;
    if (!prefs.autoStart) return;

    const total = getRestTime(context, week, rpe);
    const remaining = total;

    // Build a small RPE diff hint to display.
    let note = '';
    if (rpe != null) {
      const target = 8;
      const delta = rpe - target;
      if (delta > 0) note = `+${Math.round(delta * 15)} sec from RPE ${rpe}`;
      else if (delta < 0) note = `${Math.round(delta * 15)} sec from RPE ${rpe}`;
      else note = `RPE ${rpe} on target`;
    }

    if (intervalId) clearInterval(intervalId);

    set({ visible: true, exerciseName, total, remaining, rpeNote: note });

    if (prefs.audio) audio.tick();
    if (prefs.vibrate && navigator.vibrate) navigator.vibrate(20);

    intervalId = setInterval(() => {
      const cur = get().remaining;
      const next = cur - 1;
      if (next === 5 && prefs.audio) {
        // 3 quick beeps at 5 sec.
        audio.beep();
        setTimeout(() => audio.beep(), 220);
        setTimeout(() => audio.beep(), 440);
      }
      if (next <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        if (prefs.audio) audio.end();
        if (prefs.vibrate && navigator.vibrate) navigator.vibrate([100, 60, 100]);
        set({ visible: false, remaining: 0 });
        return;
      }
      set({ remaining: next });
    }, 1000);
  },

  adjust: (deltaSec) => {
    const cur = get();
    const remaining = Math.max(0, cur.remaining + deltaSec);
    const total = Math.max(cur.total, remaining);
    set({ remaining, total });
  },

  skip: () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    set({ visible: false, remaining: 0 });
  },
}));
