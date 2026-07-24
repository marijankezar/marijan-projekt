'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRegattaLive } from '@/lib/useRegattaLive';
import { useDefaultMapOrigin } from '@/lib/useDefaultMapOrigin';
import LiveSidebar, { type LiveParticipant } from '../../../components/regatta/LiveSidebar';

const RegattaMap = dynamic(() => import('../../../components/regatta/RegattaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

export default function LivePage() {
  const sessions = useRegattaLive();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const mapOrigin = useDefaultMapOrigin();

  const sessionList = useMemo(() => Object.values(sessions), [sessions]);
  const visibleSessions = useMemo(() => sessionList.filter((s) => !hiddenIds.has(s.sessionId)), [sessionList, hiddenIds]);

  const markers = useMemo(
    () => visibleSessions.map((s) => ({ id: s.sessionId, lat: s.lat, lng: s.lng, color: s.color, label: s.displayName })),
    [visibleSessions]
  );

  const trails = useMemo(() => {
    const map: Record<string, [number, number][]> = {};
    for (const s of visibleSessions) map[s.sessionId] = s.trail;
    return map;
  }, [visibleSessions]);

  const participants: LiveParticipant[] = useMemo(
    () =>
      sessionList
        .map((s) => ({
          id: s.sessionId,
          displayName: s.displayName,
          color: s.color,
          speed: s.speed,
          accuracy: s.accuracy,
          lastUpdate: s.lastUpdate,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [sessionList]
  );

  const toggleVisibility = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const showAll = useCallback(() => setHiddenIds(new Set()), []);
  const hideAll = useCallback(() => setHiddenIds(new Set(sessionList.map((s) => s.sessionId))), [sessionList]);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="md:w-80 shrink-0 md:h-full max-h-64 md:max-h-none">
        <LiveSidebar
          participants={participants}
          focusedId={focusedId}
          hiddenIds={hiddenIds}
          onSelect={setFocusedId}
          onToggleVisibility={toggleVisibility}
          onShowAll={showAll}
          onHideAll={hideAll}
        />
      </div>
      <div className="flex-1 min-h-[300px]">
        <RegattaMap
          markers={markers}
          trails={trails}
          focusId={focusedId}
          defaultCenter={mapOrigin?.center}
          defaultZoom={mapOrigin?.zoom}
        />
      </div>
    </div>
  );
}
