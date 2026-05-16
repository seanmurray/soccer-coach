import { useEffect } from 'react';
import { useReadinessBaseline } from '../hooks/useReadinessBaseline';
import { useSessionStore } from '../stores/sessionStore';

// Headless: bridges the async rolling baseline (React Query, needs the
// provider) into the in-memory session store so computeMode scores
// battery/stress as a deviation from the personal norm. Renders nothing.
export function ReadinessBaselineSync() {
  const { data } = useReadinessBaseline();
  const setReadinessBaseline = useSessionStore((s) => s.setReadinessBaseline);

  useEffect(() => {
    if (data) setReadinessBaseline(data);
  }, [data, setReadinessBaseline]);

  return null;
}
