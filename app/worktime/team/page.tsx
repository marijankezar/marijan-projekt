'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, TrendingUp, Calendar } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface TeamUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  role: string;
  active: boolean;
  last_login?: string;
  target_hours: number;
}

interface UserDayStat {
  user_id: number;
  actual_minutes: number;
  target_minutes: number;
  progress_pct: number;
}

function fmtMin(min: number) {
  if (!min || min <= 0) return '0:00';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${m.toString().padStart(2, '0')}h`;
}

function getProgressColor(pct: number) {
  if (pct <= 30) return 'bg-orange-400';
  if (pct <= 50) return 'bg-yellow-400';
  if (pct <= 80) return 'bg-emerald-500';
  if (pct <= 100) return 'bg-blue-500';
  return 'bg-violet-500';
}

export default function WorktimeTeamPage() {
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [users, setUsers] = useState<TeamUser[]>([]);
  const [dayStats, setDayStats] = useState<Map<number, UserDayStat>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Admin-API für User-Liste (supervisor sieht alle)
    const usersRes = await fetch('/api/worktime/admin/users');
    if (!usersRes.ok) { setLoading(false); return; }
    const usersData: TeamUser[] = await usersRes.json();
    setUsers(usersData);

    // Stats für jeden User
    const statsMap = new Map<number, UserDayStat>();
    await Promise.all(usersData.filter(u => u.active).map(async (u) => {
      const res = await fetch(`/api/worktime/stats?type=day&user_id=${u.id}`);
      if (res.ok) {
        const s = await res.json();
        statsMap.set(u.id, { user_id: u.id, ...s });
      }
    }));
    setDayStats(new Map(statsMap));
    setLoading(false);
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    supervisor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    employee: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{T.team}</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{users.filter(u => u.active).length} {lang === 'de' ? 'aktive Mitarbeiter' : lang === 'en' ? 'active members' : 'membri attivi'}</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{T.loading}</div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          {T.noEntries}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => {
            const stat = dayStats.get(user.id);
            const pct = stat?.progress_pct ?? 0;
            return (
              <div key={user.id} className={`bg-white dark:bg-gray-800/50 rounded-2xl border shadow-sm p-5 ${
                user.active
                  ? 'border-gray-100 dark:border-gray-700/50'
                  : 'border-gray-100 dark:border-gray-700/50 opacity-60'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {user.first_name || user.last_name
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : user.username}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || roleColors.employee}`}>
                        {user.role}
                      </span>
                      {!user.active && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {T.inactive}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString('de-AT')
                        : '—'}
                    </div>
                  </div>
                </div>

                {user.active && stat && (
                  <>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{T.today}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{fmtMin(stat.actual_minutes)} / {fmtMin(stat.target_minutes)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${getProgressColor(pct)} transition-all duration-500`}
                        style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{user.target_hours}h/{lang === 'de' ? 'Tag' : lang === 'en' ? 'day' : 'giorno'}</span>
                      <span>{pct}%</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
