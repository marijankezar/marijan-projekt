'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRegattaLive } from '@/lib/useRegattaLive';
import { useDefaultMapOrigin } from '@/lib/useDefaultMapOrigin';

const RegattaMap = dynamic(() => import('./RegattaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

/** Kompakte Live-Karte ohne Sidebar, z.B. für das Dashboard. */
export default function MiniLiveMap({ height = '260px' }: { height?: string }) {
  const sessions = useRegattaLive();
  const mapOrigin = useDefaultMapOrigin();
  const sessionList = useMemo(() => Object.values(sessions), [sessions]);

  const markers = useMemo(
    () => sessionList.map((s) => ({ id: s.sessionId, lat: s.lat, lng: s.lng, color: s.color, label: s.displayName })),
    [sessionList]
  );

  return (
    <div style={{ height }}>
      <RegattaMap markers={markers} defaultCenter={mapOrigin?.center} defaultZoom={mapOrigin?.zoom ?? 8} />
    </div>
  );
}
