'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Timer, Gauge, Route, Hash } from 'lucide-react';
import { colorForPersonId } from '@/lib/regatta-colors';

const RegattaMap = dynamic(() => import('../../../../components/regatta/RegattaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

interface SessionMeta {
  id: string;
  personId: string;
  displayName: string;
  startedAt: string;
  stoppedAt: string | null;
}

interface TrackStats {
  distanceMeters: number;
  durationSeconds: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [stats, setStats] = useState<TrackStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/regatta/sessions/${id}/points`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Track konnte nicht geladen werden');
        setLoading(false);
        return;
      }
      const body = await res.json();
      setSession(body.session);
      setPoints(body.points.map((p: { lat: number; lng: number }) => [p.lat, p.lng] as [number, number]));
      setStats(body.stats);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  if (error || !session) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
        {error || 'Session nicht gefunden'}
      </div>
    );
  }

  const color = colorForPersonId(session.personId);
  const markers =
    points.length > 0
      ? [
          { id: `${session.id}-start`, lat: points[0][0], lng: points[0][1], color: '#22c55e', label: 'Start', pulse: false },
          {
            id: `${session.id}-end`,
            lat: points[points.length - 1][0],
            lng: points[points.length - 1][1],
            color,
            label: 'Ende',
            pulse: false,
          },
        ]
      : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/regatta/sessions"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Verlauf
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{session.displayName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(session.startedAt).toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      <div className="h-[50vh] min-h-[320px] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 shadow-sm">
        {points.length > 1 ? (
          <RegattaMap markers={markers} trails={{ [`${session.id}-end`]: points }} />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
            Zu wenige GPS-Punkte für eine Streckendarstellung.
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon={Timer} label="Dauer" value={formatDuration(stats.durationSeconds)} />
          <StatTile icon={Route} label="Distanz" value={`${(stats.distanceMeters / 1000).toFixed(2)} km`} />
          <StatTile icon={Gauge} label="Ø-Geschwindigkeit" value={`${(stats.avgSpeedMps * 3.6).toFixed(1)} km/h`} />
          <StatTile icon={Gauge} label="Höchstgeschwindigkeit" value={`${(stats.maxSpeedMps * 3.6).toFixed(1)} km/h`} />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={Hash} label="GPS-Punkte" value={String(points.length)} />
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}
