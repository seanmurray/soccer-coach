import { useEffect, useState } from 'react';
import { Screen } from '../components/Screen';
import { Segmented } from '../components/Segmented';
import { HistoryScreen } from './HistoryScreen';
import { ProgressScreen } from './ProgressScreen';

// History tab — past sessions and long-term progress charts under one roof,
// switched by a two-way segmented control. Both panes stay mounted (hidden)
// so flipping back and forth doesn't refetch or lose scroll-local state.
const SEG_KEY = 'soccer-coach-history-seg';
const SEGMENTS = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'progress', label: 'Progress' },
];

function readSeg() {
  try {
    const v = localStorage.getItem(SEG_KEY);
    return SEGMENTS.some((s) => s.id === v) ? v : 'sessions';
  } catch {
    return 'sessions';
  }
}

export function HistoryHubScreen() {
  const [seg, setSeg] = useState(readSeg);
  useEffect(() => {
    try { localStorage.setItem(SEG_KEY, seg); } catch { /* ignore */ }
  }, [seg]);

  return (
    <Screen title="History" titleStyle={{ marginBottom: 16 }}>
      <Segmented options={SEGMENTS} value={seg} onChange={setSeg} label="History view" />
      <div hidden={seg !== 'sessions'}>
        <HistoryScreen embedded />
      </div>
      <div hidden={seg !== 'progress'}>
        <ProgressScreen embedded />
      </div>
    </Screen>
  );
}
