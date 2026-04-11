import { getSession } from '@/lib/session';
import pool from '@/db';
import Link from 'next/link';
import { Users, FolderKanban, CheckSquare, AlertCircle, Plus, ArrowRight, Clock } from 'lucide-react';
import type { CrmProjekt, CrmAufgabe } from '@/types/crm';

export const dynamic = 'force-dynamic';

export default async function CrmOverviewPage() {
  const session = await getSession();
  if (!session.user) return null;

  const userId = session.user.id;

  const [kundenRes, projekteRes, aufgabenRes, ueberfaelligRes] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM crm_kunden WHERE user_id = $1', [userId]),
    pool.query("SELECT COUNT(*) FROM crm_projekte WHERE user_id = $1 AND status = 'aktiv'", [userId]),
    pool.query("SELECT COUNT(*) FROM crm_aufgaben WHERE user_id = $1 AND status != 'erledigt'", [userId]),
    pool.query("SELECT COUNT(*) FROM crm_aufgaben WHERE user_id = $1 AND status != 'erledigt' AND faellig_am < CURRENT_DATE", [userId]),
  ]);

  const recentProjekteRes = await pool.query<CrmProjekt>(
    `SELECT p.*, k.name AS kunde_name FROM crm_projekte p
     LEFT JOIN crm_kunden k ON p.kunde_id = k.id
     WHERE p.user_id = $1 ORDER BY p.erstellt_am DESC LIMIT 5`,
    [userId]
  );

  const recentAufgabenRes = await pool.query<CrmAufgabe>(
    `SELECT a.*, p.titel AS projekt_titel FROM crm_aufgaben a
     LEFT JOIN crm_projekte p ON a.projekt_id = p.id
     WHERE a.user_id = $1 AND a.status != 'erledigt' ORDER BY a.faellig_am ASC NULLS LAST LIMIT 5`,
    [userId]
  );

  const stats = {
    kunden: parseInt(kundenRes.rows[0].count),
    aktiveProjekte: parseInt(projekteRes.rows[0].count),
    offeneAufgaben: parseInt(aufgabenRes.rows[0].count),
    ueberfaellig: parseInt(ueberfaelligRes.rows[0].count),
  };

  const statusColors: Record<string, string> = {
    offen: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    aktiv: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    abgeschlossen: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    pausiert: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  };

  const prioritaetColors: Record<string, string> = {
    hoch: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    mittel: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    niedrig: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Übersicht</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Dein CRM auf einen Blick</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/crm/kunden" className="group bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-violet-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.kunden}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kunden</p>
        </Link>

        <Link href="/crm/projekte?status=aktiv" className="group bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.aktiveProjekte}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Aktive Projekte</p>
        </Link>

        <Link href="/crm/aufgaben" className="group bg-white dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.offeneAufgaben}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Offene Aufgaben</p>
        </Link>

        <div className={`rounded-2xl p-5 border shadow-sm ${stats.ueberfaellig > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.ueberfaellig > 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <AlertCircle className={`w-5 h-5 ${stats.ueberfaellig > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${stats.ueberfaellig > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {stats.ueberfaellig}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Überfällig</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Neueste Projekte */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Neueste Projekte</h3>
            </div>
            <Link href="/crm/projekte" className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              Alle <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentProjekteRes.rows.length === 0 ? (
            <div className="p-8 text-center">
              <FolderKanban className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Noch keine Projekte</p>
              <Link href="/crm/projekte" className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline">
                <Plus className="w-4 h-4" /> Projekt anlegen
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentProjekteRes.rows.map((p) => (
                <li key={p.id}>
                  <Link href={`/crm/projekte/${p.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{p.titel}</p>
                      {p.kunde_name && <p className="text-xs text-gray-500 dark:text-gray-400">{p.kunde_name}</p>}
                    </div>
                    <span className={`ml-3 shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Nächste Aufgaben */}
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Nächste Aufgaben</h3>
            </div>
            <Link href="/crm/aufgaben" className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              Alle <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentAufgabenRes.rows.length === 0 ? (
            <div className="p-8 text-center">
              <CheckSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Keine offenen Aufgaben</p>
              <Link href="/crm/aufgaben" className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline">
                <Plus className="w-4 h-4" /> Aufgabe anlegen
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentAufgabenRes.rows.map((a) => {
                const isUeberfaellig = a.faellig_am && new Date(a.faellig_am) < new Date();
                return (
                  <li key={a.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{a.titel}</p>
                      {a.faellig_am && (
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${isUeberfaellig ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          <Clock className="w-3 h-3" />
                          {new Date(a.faellig_am).toLocaleDateString('de-AT')}
                          {isUeberfaellig && ' · überfällig'}
                        </p>
                      )}
                    </div>
                    <span className={`ml-3 shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${prioritaetColors[a.prioritaet]}`}>
                      {a.prioritaet}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/crm/kunden', label: 'Neuer Kunde', icon: Users, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25' },
          { href: '/crm/projekte', label: 'Neues Projekt', icon: FolderKanban, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
          { href: '/crm/aufgaben', label: 'Neue Aufgabe', icon: CheckSquare, color: 'from-indigo-500 to-violet-600', shadow: 'shadow-indigo-500/25' },
        ].map(({ href, label, icon: Icon, color, shadow }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r ${color} text-white font-semibold shadow-lg ${shadow} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
          >
            <Plus className="w-5 h-5" />
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
