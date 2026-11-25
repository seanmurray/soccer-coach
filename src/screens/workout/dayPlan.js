import { EX } from '../../data/exercises';
import { SESSIONS } from '../../data/sessions';
import { buildHomesFor } from '../../data/rotation';
import { getStrengthPrescription } from '../../lib/periodization';
import { resolveSlot } from '../../lib/resolveSlot';

// What's on the menu for a day, as display sections for the Day overview.
// Pure — the caller passes the slot-store choices so swaps show up.
//
// Returns [{ id, label, items: [{ id, name, target, cue, url, homeKey? }] }]
export function dayPlan({ dayType, mode, week, season, today = {}, block = {} }) {
  const day = SESSIONS[mode]?.[dayType] ?? SESSIONS.full[dayType];
  if (!day) return [];

  const slotItem = (homeKey, targetFor) => {
    const res = resolveSlot(homeKey, week, today[homeKey], block[homeKey]);
    const ex = res.isCustom ? null : EX[res.activeKey];
    return {
      id: homeKey,
      homeKey,
      activeKey: res.activeKey,
      isCustom: res.isCustom,
      name: res.name,
      target: targetFor(res, ex),
      cue: ex?.cue,
      url: ex?.url,
    };
  };

  const exItem = (k) => ({ id: k, name: EX[k]?.name ?? k, target: EX[k]?.target, cue: EX[k]?.cue, url: EX[k]?.url });

  if (dayType === 'cond') {
    const protocols = SESSIONS.full.cond.protocols ?? [];
    return [
      {
        id: 'conditioning',
        label: 'Conditioning · pick 1–2',
        items: protocols.map((p) => ({ id: p.name, name: p.name, target: p.rpe ? `RPE ${p.rpe}` : null, cue: p.desc ?? p.notes })),
      },
      {
        id: 'build',
        label: 'Finisher',
        items: buildHomesFor('cond', mode).map((h) => slotItem(h, (res, ex) => ex?.target ?? '3×8')),
      },
    ].filter((s) => s.items.length > 0);
  }

  return [
    { id: 'agility', label: 'Agility', items: (day.agility ?? []).filter((k) => EX[k]).map(exItem) },
    { id: 'plyo', label: 'Plyometrics', items: (day.plyo ?? []).filter((k) => EX[k]).map(exItem) },
    {
      id: 'strength',
      label: 'Strength',
      items: (day.strength ?? []).map((h) =>
        slotItem(h, (res) => {
          if (res.isCustom) return 'log by feel';
          const prx = getStrengthPrescription(res.activeKey, week, mode, season);
          return `${prx.sets}×${prx.reps} @ ${Math.round(prx.pct * 100)}%`;
        })
      ),
    },
    {
      id: 'build',
      label: 'Build / Trunk',
      items: buildHomesFor(dayType, mode).map((h) => slotItem(h, (res, ex) => ex?.target ?? '3×8')),
    },
  ].filter((s) => s.items.length > 0);
}
