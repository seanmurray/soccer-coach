import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { TodayScreen } from './screens/TodayScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { HistoryScreen } from './screens/HistoryScreen';

// Persist the active tab so an iPad PWA reload (Safari suspends backgrounded
// tabs) returns the kid to where he was instead of always Today.
const TAB_KEY = 'ya-tab';
const VALID_TABS = ['today', 'library', 'history'];
function readTab() {
  try {
    const v = localStorage.getItem(TAB_KEY);
    return VALID_TABS.includes(v) ? v : 'today';
  } catch {
    return 'today';
  }
}

export default function App() {
  const [tab, setTab] = useState(readTab);
  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* ignore */ }
  }, [tab]);

  return (
    <>
      <div hidden={tab !== 'today'}>
        <TodayScreen />
      </div>
      <div hidden={tab !== 'library'}>
        <LibraryScreen />
      </div>
      <div hidden={tab !== 'history'}>
        <HistoryScreen />
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </>
  );
}
