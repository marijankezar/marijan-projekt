'use client';

import { useEffect, useState } from 'react';
import { Signal, SignalLow, SignalZero } from 'lucide-react';

interface GpsQualityBadgeProps {
  /** ISO-Timestamp des letzten empfangenen GPS-Punkts, oder null falls noch keiner da. */
  lastUpdate: string | null;
  accuracy?: number | null;
  className?: string;
}

/** Ampel: grün < 10s, gelb < 30s, rot >= 30s (bzw. kein Signal). */
export default function GpsQualityBadge({ lastUpdate, accuracy, className = '' }: GpsQualityBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const ageSeconds = lastUpdate ? (now - new Date(lastUpdate).getTime()) / 1000 : Infinity;

  const level =
    ageSeconds < 10 ? 'good' : ageSeconds < 30 ? 'stale' : 'bad';

  const styles = {
    good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    stale: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    bad: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  } as const;

  const Icon = level === 'good' ? Signal : level === 'stale' ? SignalLow : SignalZero;
  const label = level === 'good' ? 'GPS aktuell' : level === 'stale' ? 'GPS verzögert' : 'Kein Signal';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[level]} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
      {accuracy != null && <span className="opacity-70 font-normal">±{Math.round(accuracy)}m</span>}
    </span>
  );
}
