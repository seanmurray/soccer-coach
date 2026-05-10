import common from '../components/Common.module.css';

export function HistoryScreen() {
  return (
    <main className="screen">
      <div className="title-xl" style={{ marginBottom: 20 }}>History</div>
      <div className={common.card}>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--t2)' }}>
          Past sessions will live here — date, mode badge, day type, week,
          recovery%, RPE, and an expandable view of all logged sets and
          exercise feedback. Wire to <code>soccer_sessions</code> via React
          Query in the next pass.
        </p>
      </div>
    </main>
  );
}
