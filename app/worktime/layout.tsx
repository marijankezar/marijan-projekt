'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, LayoutDashboard, Timer, CheckSquare, Users, BarChart2,
  Settings, LogOut, Globe, AlertTriangle, X
} from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';
import type { WtUser } from '@/lib/worktime-session';

const SESSION_TIMEOUT = 60 * 60 * 1000;   // 60 Minuten
const WARNING_AT     = 55 * 60 * 1000;    // Warnung bei 55 min

export default function WorktimeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<WtUser | null>(null);
  const [lang, setLang] = useState<Lang>('de');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);     // laufender Timer
  const [sessionLeft, setSessionLeft] = useState(SESSION_TIMEOUT);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  const T = translations[lang];

  // Sprachspeicherung
  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('wt_lang', l);
  };

  // User laden (öffentliche Seiten überspringen)
  const isPublicPage = pathname === '/worktime/login' || pathname === '/worktime/register';

  // Timer zurücksetzen wenn User von Login-Seite zur App wechselt
  useEffect(() => {
    if (!isPublicPage) {
      lastActivityRef.current = Date.now();
      warningShownRef.current = false;
      setSessionLeft(SESSION_TIMEOUT);
    }
  }, [isPublicPage]);

  useEffect(() => {
    if (isPublicPage) return;
    fetch('/api/worktime/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user) { router.push('/worktime/login'); return; }
        setUser(d.user);
      })
      .catch(() => router.push('/worktime/login'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicPage]);

  // Live-Timer: laufenden Eintrag tracken
  useEffect(() => {
    if (isPublicPage || !user) return;

    const fetchRunning = async () => {
      const res = await fetch('/api/worktime/time-entries/running');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const elapsed = Math.max(0, Math.round(parseFloat(data.elapsed_minutes) * 60));
          setElapsedSeconds(elapsed);
        } else {
          setElapsedSeconds(0);
        }
      }
    };

    fetchRunning();
    const interval = setInterval(() => {
      setElapsedSeconds((s) => (s > 0 ? s + 1 : 0));
    }, 1000);
    const refetch = setInterval(fetchRunning, 60000);
    return () => { clearInterval(interval); clearInterval(refetch); };
  }, [isPublicPage, user]);

  // Session-Inaktivitäts-Tracking
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    setShowWarning(false);
    setSessionLeft(SESSION_TIMEOUT);
  }, []);

  useEffect(() => {
    if (isPublicPage) return;
    const events = ['mousemove', 'keypress', 'click', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, resetActivity));
  }, [isPublicPage, resetActivity]);

  useEffect(() => {
    if (isPublicPage) return;
    const tick = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      const left = Math.max(0, SESSION_TIMEOUT - idle);
      setSessionLeft(left);

      if (left <= (SESSION_TIMEOUT - WARNING_AT) && !warningShownRef.current) {
        warningShownRef.current = true;
        setShowWarning(true);
      }

      if (left === 0) {
        clearInterval(tick);
        fetch('/api/worktime/auth/logout', { method: 'POST' }).finally(() => {
          router.push('/worktime/login');
        });
      }
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicPage]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatSession = (ms: number) => {
    const m = Math.floor(ms / 60000).toString().padStart(2, '0');
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  async function handleLogout() {
    await fetch('/api/worktime/auth/logout', { method: 'POST' });
    router.push('/worktime/login');
  }

  // Öffentliche Seiten: nur children rendern
  if (isPublicPage) return <>{children}</>;

  const isSupervisor = user && (user.role === 'supervisor' || user.role === 'admin');
  const isAdmin = user?.role === 'admin';

  const navLinks = [
    { href: '/worktime', label: T.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/worktime/time', label: T.time, icon: Timer },
    { href: '/worktime/tasks', label: T.tasks, icon: CheckSquare },
    ...(isSupervisor ? [
      { href: '/worktime/customers', label: T.customers, icon: Users },
      { href: '/worktime/team', label: T.team, icon: Users },
    ] : []),
    { href: '/worktime/stats', label: T.stats, icon: BarChart2 },
    ...(isAdmin ? [{ href: '/worktime/admin', label: T.admin, icon: Settings }] : []),
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Live Timer */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Worktime</h1>
                {elapsedSeconds > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold animate-pulse">
                    ● {formatTimer(elapsedSeconds)}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive(href, exact)
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* Right: Lang + Session + User + Logout */}
            <div className="flex items-center gap-2">
              {/* Lang switcher */}
              <div className="hidden sm:flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                {(['de', 'en', 'it'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      lang === l
                        ? 'bg-emerald-500 text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Session countdown */}
              <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono ${
                sessionLeft < 5 * 60 * 1000
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                <Timer className="w-3 h-3" />
                {formatSession(sessionLeft)}
              </div>

              {/* User badge */}
              {user && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.username}</span>
                  <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400'
                      : user.role === 'supervisor'
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
              )}

              <button
                onClick={handleLogout}
                title={T.logout}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Session Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold">{T.sessionWarning}</h3>
              </div>
              <button onClick={() => { setShowWarning(false); resetActivity(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {lang === 'de'
                ? `Session läuft in ${formatSession(sessionLeft)} ab. Möchten Sie angemeldet bleiben?`
                : lang === 'en'
                ? `Session expires in ${formatSession(sessionLeft)}. Stay logged in?`
                : `Sessione scade in ${formatSession(sessionLeft)}. Rimanere connesso?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowWarning(false); resetActivity(); }}
                className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
              >
                {lang === 'de' ? 'Angemeldet bleiben' : lang === 'en' ? 'Stay logged in' : 'Rimani connesso'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {T.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around py-2">
          {navLinks.slice(0, 5).map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-all ${
                isActive(href, exact)
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
