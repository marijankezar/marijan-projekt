import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { Sailboat, Users, Radio, LayoutDashboard, Navigation, User, ShieldCheck, History, Settings } from 'lucide-react';
import { getRegattaSession } from '@/lib/regatta-session';
import RegattaLogoutButton from '../../components/regatta/RegattaLogoutButton';

export const metadata: Metadata = {
  title: 'Regatta-Tracking',
  description: 'Live-GPS-Tracking für Regatta-Teilnehmer',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function RegattaProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getRegattaSession();
  if (!session.user) {
    redirect('/regatta/login');
  }
  const user = session.user;

  const navLinks = [
    { href: '/regatta/tracking', label: 'Tracking', icon: Navigation },
    { href: '/regatta/live', label: 'Live-Karte', icon: Radio },
    { href: '/regatta/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/regatta/sessions', label: 'Verlauf', icon: History },
    ...(user.isAdmin
      ? [
          { href: '/regatta/crew', label: 'Crew', icon: Users },
          { href: '/regatta/admin', label: 'Verwaltung', icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sailboat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Regatta-Tracking</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">kezar.at</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.displayName}</span>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <RegattaLogoutButton />
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around py-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">{children}</main>
    </div>
  );
}
