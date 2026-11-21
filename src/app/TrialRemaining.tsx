import { useEffect, useState } from 'react';
import { trialCaption, type DemoAccess } from '../domain/trial';
export function TrialRemaining({ access }: { access: DemoAccess | null }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return <small className="trial-remaining">{trialCaption(access, now)}</small>;
}
