import { Users, Radio, CalendarCheck, MapPinned, Sailboat, Flag, Gauge } from 'lucide-react';
import regattaPool from '@/db-regatta';
import MiniLiveMap from '../../../components/regatta/MiniLiveMap';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [personsRes, activeRes, todayRes, pointsRes, participantsRes, boatsRes, runningEventsRes, finishesRes, avgSpeedRes] =
    await Promise.all([
      regattaPool.query('SELECT COUNT(*)::int AS count FROM person'),
      regattaPool.query('SELECT COUNT(*)::int AS count FROM track_session WHERE active = true'),
      regattaPool.query(
        `SELECT COUNT(*)::int AS count FROM track_session WHERE started_at >= date_trunc('day', now())`
      ),
      regattaPool.query('SELECT COUNT(*)::int AS count FROM gps_point'),
      regattaPool.query(
        `SELECT (SELECT COUNT(DISTINCT skipper_id) FROM entry) + (SELECT COUNT(*) FROM entry_crew) AS count`
      ),
      regattaPool.query('SELECT COUNT(*)::int AS count FROM entry'),
      regattaPool.query(`SELECT COUNT(*)::int AS count FROM event WHERE status = 'active'`),
      regattaPool.query('SELECT COUNT(*)::int AS count FROM finish_time'),
      regattaPool.query(
        `SELECT AVG(gp.speed) AS avg
         FROM gps_point gp JOIN track_session ts ON ts.id = gp.session_id
         WHERE ts.active = true AND gp.speed IS NOT NULL AND gp.timestamp >= now() - interval '5 minutes'`
      ),
    ]);
  return {
    persons: personsRes.rows[0].count,
    activeTrackers: activeRes.rows[0].count,
    sessionsToday: todayRes.rows[0].count,
    gpsPoints: pointsRes.rows[0].count,
    participants: participantsRes.rows[0].count,
    boats: boatsRes.rows[0].count,
    runningEvents: runningEventsRes.rows[0].count,
    finishes: finishesRes.rows[0].count,
    avgSpeedKmh: avgSpeedRes.rows[0].avg != null ? Number(avgSpeedRes.rows[0].avg) * 3.6 : null,
  };
}

export default async function RegattaDashboardPage() {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Regatta-Kennzahlen</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Teilnehmer" value={stats.participants} />
          <StatCard icon={Sailboat} label="Boote" value={stats.boats} />
          <StatCard icon={CalendarCheck} label="Laufende Regatten" value={stats.runningEvents} highlight={stats.runningEvents > 0} />
          <StatCard icon={Flag} label="Zieleinläufe" value={stats.finishes} />
          <StatCard
            icon={Gauge}
            label="Ø-Geschwindigkeit"
            value={stats.avgSpeedKmh != null ? `${stats.avgSpeedKmh.toFixed(1)} km/h` : '—'}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Tracking-Kennzahlen</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Personen" value={stats.persons} />
          <StatCard icon={Radio} label="Aktive Tracker" value={stats.activeTrackers} highlight={stats.activeTrackers > 0} />
          <StatCard icon={CalendarCheck} label="Sessions heute" value={stats.sessionsToday} />
          <StatCard icon={MapPinned} label="GPS-Punkte gesamt" value={stats.gpsPoints} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Live-Karte</h2>
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/50 shadow-sm">
          <MiniLiveMap height="320px" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm mb-2">
        <Icon className={`w-4 h-4 ${highlight ? 'text-red-500' : ''}`} />
        {label}
      </div>
      <div className={`text-3xl font-bold tabular-nums ${highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
    </div>
  );
}
