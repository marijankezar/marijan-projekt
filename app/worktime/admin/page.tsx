'use client';

import { useState, useEffect } from 'react';
import { Settings, UserCheck, UserX, Shield, Unlock, Clock } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'employee' | 'supervisor' | 'admin';
  active: boolean;
  lang: string;
  target_hours: number;
  login_attempts: number;
  locked_until?: string;
  last_login?: string;
  created_at: string;
}

const roleColors = {
  admin: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  supervisor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  employee: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

export default function WorktimeAdminPage() {
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/worktime/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  async function updateUser(id: number, payload: Record<string, unknown>) {
    setSaving(id);
    await fetch('/api/worktime/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
    await fetchUsers();
    setSaving(null);
  }

  const isLocked = (u: AdminUser) => u.locked_until && new Date(u.locked_until) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-500" />{T.admin}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {users.length} {lang === 'de' ? 'Benutzer' : lang === 'en' ? 'users' : 'utenti'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{T.loading}</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className={`bg-white dark:bg-gray-800/50 rounded-2xl border shadow-sm p-5 ${
              !u.active ? 'border-amber-200 dark:border-amber-800/50' : 'border-gray-100 dark:border-gray-700/50'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.username}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role]}`}>{u.role}</span>
                    {!u.active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {lang === 'de' ? 'wartet auf Freischaltung' : lang === 'en' ? 'pending activation' : 'in attesa di attivazione'}
                      </span>
                    )}
                    {isLocked(u) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        {lang === 'de' ? 'gesperrt' : lang === 'en' ? 'locked' : 'bloccato'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    @{u.username} · {u.email}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {T.targetHoursDay}: {u.target_hours}h
                    </span>
                    {u.last_login && (
                      <span>{T.lastLogin}: {new Date(u.last_login).toLocaleDateString('de-AT')}</span>
                    )}
                    {u.login_attempts > 0 && (
                      <span className="text-amber-500">{T.loginAttempts}: {u.login_attempts}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {!u.active ? (
                    <button
                      onClick={() => updateUser(u.id, { active: true })}
                      disabled={saving === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-all disabled:opacity-60"
                    >
                      <UserCheck className="w-3.5 h-3.5" />{T.activate}
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUser(u.id, { active: false })}
                      disabled={saving === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-60"
                    >
                      <UserX className="w-3.5 h-3.5" />{T.deactivate}
                    </button>
                  )}

                  {isLocked(u) && (
                    <button
                      onClick={() => updateUser(u.id, { unlock: true })}
                      disabled={saving === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-all disabled:opacity-60"
                    >
                      <Unlock className="w-3.5 h-3.5" />{T.unlock}
                    </button>
                  )}

                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    disabled={saving === u.id}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-60"
                  >
                    <option value="employee">{T.employee}</option>
                    <option value="supervisor">{T.supervisor}</option>
                    <option value="admin">Admin</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      defaultValue={u.target_hours}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val !== u.target_hours) updateUser(u.id, { target_hours: val });
                      }}
                      className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <span className="text-xs text-gray-400">h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
