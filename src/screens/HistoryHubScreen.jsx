import { useEffect, useState } from 'react';
import { Screen } from '../components/Screen';
import { Segmented } from '../components/Segmented';
import { HistoryScreen } from './HistoryScreen';
import { ProgressScreen } from './ProgressScreen';
import { HistoryOverview } from '../components/history/HistoryOverview';

// History tab — past sessions and long-term progress charts under one roof,
// switched by a two-way segmented control. Both panes stay mounted (hidden)
// so flipping back and forth doesn't refetch or lose scroll-local state.
const SEG_KEY = 'soccer-coach-history-seg';
const VIEW_KEY = 'soccer-coach-history-view';
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

  // Calendar or list under the overview chart.
  const [view, setView] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'calendar' ? 'calendar' : 'list'; } catch { return 'list'; }
  });
  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view); } catch { /* ignore */ }
  }, [view]);

  // Tapping a calendar day: switch to the list, open that session, scroll to it.
  const [focusId, setFocusId] = useState(null);
  const pickSession = (id) => {
    setFocusId(id);
    setView('list');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(`session-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  };

  return (
    <Screen title="History" titleStyle={{ marginBottom: 16 }}>
      <Segmented options={SEGMENTS} value={seg} onChange={setSeg} label="History view" />
      <div hidden={seg !== 'sessions'}>
        <HistoryOverview view={view} onViewChange={setView} onPickSession={pickSession} />
        <div hidden={view !== 'list'}>
          <HistoryScreen embedded focusId={focusId} />
        </div>
      </div>
      <div hidden={seg !== 'progress'}>
        <ProgressScreen embedded />
      </div>
    </Screen>
  );
}
