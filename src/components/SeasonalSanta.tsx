import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  isSeasonalSantaVisibleAt,
  millisecondsUntilNextLagosMidnight,
} from '@/lib/seasonalSanta';
import './SeasonalSanta.css';

export default function SeasonalSanta() {
  const [isInSeason, setIsInSeason] = useState(() => isSeasonalSantaVisibleAt(new Date()));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;

    const refreshSeason = () => {
      setIsInSeason(isSeasonalSantaVisibleAt(new Date()));
    };

    const scheduleMidnightRefresh = () => {
      midnightTimer = setTimeout(() => {
        refreshSeason();
        scheduleMidnightRefresh();
      }, millisecondsUntilNextLagosMidnight(new Date()));
    };

    const refreshWhenPageReturns = () => {
      if (document.visibilityState === 'visible') refreshSeason();
    };

    scheduleMidnightRefresh();
    window.addEventListener('focus', refreshSeason);
    document.addEventListener('visibilitychange', refreshWhenPageReturns);

    return () => {
      clearTimeout(midnightTimer);
      window.removeEventListener('focus', refreshSeason);
      document.removeEventListener('visibilitychange', refreshWhenPageReturns);
    };
  }, []);

  if (!isInSeason || dismissed) return null;

  return (
    <aside className="seasonal-santa" aria-label="Christmas greeting">
      <img
        className="seasonal-santa__character"
        src="/santa-dancing.svg"
        alt="Dancing Father Christmas"
        width="240"
        height="280"
        decoding="async"
      />
      <button
        type="button"
        className="seasonal-santa__close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss Father Christmas"
        title="Dismiss"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </aside>
  );
}
