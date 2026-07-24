'use client';

import { Gauge, Eye, EyeOff } from 'lucide-react';
import GpsQualityBadge from './GpsQualityBadge';

export interface LiveParticipant {
  id: string; // sessionId - eindeutiger Schlüssel, korrespondiert mit dem Marker auf der Karte
  displayName: string;
  color: string;
  speed: number | null; // m/s
  accuracy: number | null;
  lastUpdate: string;
}

interface LiveSidebarProps {
  participants: LiveParticipant[];
  focusedId: string | null;
  hiddenIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export default function LiveSidebar({
  participants,
  focusedId,
  hiddenIds,
  onSelect,
  onToggleVisibility,
  onShowAll,
  onHideAll,
}: LiveSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Aktive Teilnehmer <span className="text-gray-400 font-normal">({participants.length})</span>
          </h2>
        </div>
        {participants.length > 0 && (
          <div className="flex gap-3 text-xs">
            <button onClick={onShowAll} className="text-blue-600 dark:text-blue-400 hover:underline">
              Alle anzeigen
            </button>
            <button onClick={onHideAll} className="text-blue-600 dark:text-blue-400 hover:underline">
              Alle ausblenden
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {participants.map((p) => {
          const hidden = hiddenIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`flex items-center gap-1 px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                focusedId === p.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              } ${hidden ? 'opacity-40' : ''}`}
            >
              <button
                onClick={() => onToggleVisibility(p.id)}
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={hidden ? `${p.displayName} einblenden` : `${p.displayName} ausblenden`}
                title={hidden ? 'Einblenden' : 'Ausblenden'}
              >
                {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => onSelect(p.id)} className="flex-1 min-w-0 text-left px-2 py-1.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="font-medium text-gray-900 dark:text-white truncate">{p.displayName}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" />
                    {p.speed != null ? `${(p.speed * 3.6).toFixed(1)} km/h` : '—'}
                  </span>
                  <GpsQualityBadge lastUpdate={p.lastUpdate} accuracy={p.accuracy} />
                </div>
              </button>
            </div>
          );
        })}
        {participants.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Aktuell trackt niemand.</div>
        )}
      </div>
    </div>
  );
}
