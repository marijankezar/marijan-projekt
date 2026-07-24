'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Loader2, Gauge, Timer, MapPin, Hash } from 'lucide-react';
import HoldToStopButton from '../../../components/regatta/HoldToStopButton';
import GpsQualityBadge from '../../../components/regatta/GpsQualityBadge';
import { colorForPersonId } from '@/lib/regatta-colors';
import { useDefaultMapOrigin } from '@/lib/useDefaultMapOrigin';
import type { GpsPointInput } from '@/lib/regatta-validation';

const RegattaMap = dynamic(() => import('../../../components/regatta/RegattaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

interface RegattaUser {
  id: string;
  displayName: string;
}

interface LastPosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  timestamp: number; // epoch ms
}

interface ActiveEntry {
  entryId: string;
  boatName: string;
  startNumber: string;
  eventId: string;
  eventName: string;
  gpsIntervalSeconds: number;
}

const DEFAULT_SEND_INTERVAL_SECONDS = 5; // Ad-hoc-Tracking ohne Event-Zuordnung

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function TrackingPage() {
  const [user, setUser] = useState<RegattaUser | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [lastPosition, setLastPosition] = useState<LastPosition | null>(null);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeEntries, setActiveEntries] = useState<ActiveEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null); // mit der laufenden Session verknüpfte Meldung
  const mapOrigin = useDefaultMapOrigin();

  const watchIdRef = useRef<number | null>(null);
  const queueRef = useRef<GpsPointInput[]>([]);
  const processingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const latestFixRef = useRef<GpsPointInput | null>(null);
  const sendIntervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sequentielle Sendequeue: nie zwei parallele POSTs, aber kein Punkt geht verloren.
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    while (queueRef.current.length > 0) {
      const point = queueRef.current.shift()!;
      try {
        const res = await fetch('/api/regatta/gps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point),
        });
        if (res.ok) {
          const body = await res.json();
          if (body.stored) setPointCount((c) => c + 1);
        }
      } catch {
        // Netzwerkfehler: Punkt wird verworfen (Offline-Queue ist ein Folge-Feature)
      }
    }
    processingRef.current = false;
  }, []);

  const enqueuePoint = useCallback(
    (point: GpsPointInput) => {
      queueRef.current.push(point);
      processQueue();
    },
    [processQueue]
  );

  // GPS-Fixe werden kontinuierlich erfasst (beste Genauigkeit) und sofort in der UI
  // angezeigt, aber nur im konfigurierten Intervall an den Server gesendet (siehe
  // startSendTimer) - entkoppelt Erfassung von Sendecadence, spart Akku/Bandbreite.
  const startWatch = useCallback((sid: string) => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation wird von diesem Browser nicht unterstützt.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError(null);
        const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
        setLastPosition({ latitude, longitude, accuracy, speed, heading, altitude, timestamp: pos.timestamp });
        setTrail((prev) => [...prev, [latitude, longitude] as [number, number]].slice(-1000));
        latestFixRef.current = {
          sessionId: sid,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          altitude,
          timestamp: pos.timestamp,
        };
      },
      (err) => setGeoError(err.message || 'GPS-Fehler'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    watchIdRef.current = id;
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startSendTimer = useCallback(
    (intervalSeconds: number) => {
      if (sendIntervalIdRef.current != null) clearInterval(sendIntervalIdRef.current);
      sendIntervalIdRef.current = setInterval(() => {
        const fix = latestFixRef.current;
        if (!fix) return;
        latestFixRef.current = null;
        enqueuePoint(fix);
      }, Math.max(1, intervalSeconds) * 1000);
    },
    [enqueuePoint]
  );

  const stopSendTimer = useCallback(() => {
    if (sendIntervalIdRef.current != null) {
      clearInterval(sendIntervalIdRef.current);
      sendIntervalIdRef.current = null;
    }
    latestFixRef.current = null;
  }, []);

  // Initial: eingeloggte Person + trackbare Meldungen laden, evtl. aktive Session nach Reload fortsetzen
  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/regatta/auth/me');
      if (meRes.ok) {
        const { user: u } = await meRes.json();
        setUser(u);
      }
      const entriesRes = await fetch('/api/regatta/entries/me/active');
      if (entriesRes.ok) {
        const { rows } = await entriesRes.json();
        setActiveEntries(rows);
        if (rows.length === 1) setSelectedEntryId(rows[0].entryId);
      }
      const sessRes = await fetch('/api/regatta/sessions');
      if (sessRes.ok) {
        const { activeSession } = await sessRes.json();
        if (activeSession) {
          sessionIdRef.current = activeSession.id;
          setSessionId(activeSession.id);
          setEntryId(activeSession.entryId ?? null);
          setStartedAt(new Date(activeSession.startedAt));
          setPointCount(activeSession.pointCount);
          setActive(true);
          startWatch(activeSession.id);
          startSendTimer(activeSession.gpsIntervalSeconds ?? DEFAULT_SEND_INTERVAL_SECONDS);
        }
      }
    })();
    return () => {
      stopWatch();
      stopSendTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Laufzeit-Timer
  useEffect(() => {
    if (!active || !startedAt) return;
    const interval = setInterval(() => {
      setElapsed((Date.now() - startedAt.getTime()) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [active, startedAt]);

  async function handleStart() {
    setStarting(true);
    setGeoError(null);
    try {
      const selectedEntry = activeEntries.find((e) => e.entryId === selectedEntryId) ?? null;
      const res = await fetch('/api/regatta/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: selectedEntry?.entryId ?? null }),
      });
      const body = await res.json();
      if (!res.ok && res.status !== 409) throw new Error(body.error || 'Start fehlgeschlagen');
      sessionIdRef.current = body.id;
      setSessionId(body.id);
      setEntryId(body.entryId ?? null);
      setStartedAt(new Date(body.startedAt));
      setPointCount(0);
      setTrail([]);
      setActive(true);
      startWatch(body.id);
      startSendTimer(selectedEntry?.gpsIntervalSeconds ?? DEFAULT_SEND_INTERVAL_SECONDS);
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : 'Start fehlgeschlagen');
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    stopWatch();
    stopSendTimer();
    const sid = sessionIdRef.current;
    if (sid) {
      await fetch(`/api/regatta/sessions/${sid}`, { method: 'PATCH' }).catch(() => {});
    }
    sessionIdRef.current = null;
    setEntryId(null);
    setActive(false);
    setSessionId(null);
    setStartedAt(null);
    setElapsed(0);
    setPointCount(0);
    setLastPosition(null);
    setTrail([]);
  }

  const markerColor = user ? colorForPersonId(user.id) : '#2563eb';
  const markers = lastPosition
    ? [{ id: sessionId ?? 'me', lat: lastPosition.latitude, lng: lastPosition.longitude, color: markerColor, label: user?.displayName ?? '' }]
    : [];
  const lastUpdateIso = lastPosition ? new Date(lastPosition.timestamp).toISOString() : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Willkommen</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.displayName ?? '…'}</h1>
      </div>

      <div className="h-[45vh] min-h-[320px] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <RegattaMap
          markers={markers}
          trails={sessionId ? { [sessionId]: trail } : {}}
          focusId={markers[0]?.id ?? null}
          defaultZoom={lastPosition ? 15 : mapOrigin?.zoom}
          defaultCenter={lastPosition ? [lastPosition.latitude, lastPosition.longitude] : mapOrigin?.center}
        />
      </div>

      {geoError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {geoError}
        </div>
      )}

      {!active ? (
        <div className="flex flex-col items-center justify-center py-8 gap-5">
          {activeEntries.length > 1 && (
            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-center">
                Für welches Boot tracken?
              </label>
              <select
                value={selectedEntryId ?? ''}
                onChange={(e) => setSelectedEntryId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {activeEntries.map((e) => (
                  <option key={e.entryId} value={e.entryId}>
                    #{e.startNumber} {e.boatName} — {e.eventName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {activeEntries.length === 1 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tracking für <strong>{activeEntries[0].boatName}</strong> (#{activeEntries[0].startNumber}) bei{' '}
              {activeEntries[0].eventName}
            </p>
          )}
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-xl
                       flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 active:scale-95
                       disabled:opacity-50"
          >
            {starting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 fill-current" />}
            <span className="text-xs font-semibold">{starting ? 'Startet…' : 'Start'}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Tracking aktiv
            </span>
            <GpsQualityBadge lastUpdate={lastUpdateIso} accuracy={lastPosition?.accuracy ?? null} />
          </div>

          {entryId && (
            <p className="text-xs text-gray-400 mb-4">
              Verknüpft mit {activeEntries.find((e) => e.entryId === entryId)?.boatName ?? 'Meldung'}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatTile icon={Timer} label="Zeit seit Start" value={formatElapsed(elapsed)} />
            <StatTile
              icon={Gauge}
              label="Geschwindigkeit"
              value={lastPosition?.speed != null ? `${(lastPosition.speed * 3.6).toFixed(1)} km/h` : '—'}
            />
            <StatTile
              icon={MapPin}
              label="Genauigkeit"
              value={lastPosition?.accuracy != null ? `±${Math.round(lastPosition.accuracy)} m` : '—'}
            />
            <StatTile icon={Hash} label="Gesendete Punkte" value={String(pointCount)} />
          </div>

          <div className="flex justify-center">
            <HoldToStopButton onConfirm={handleStop} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}
