import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import { Briefcase, Users, FolderKanban, CheckSquare, LayoutDashboard, User, ArrowLeft } from 'lucide-react';
import LogoutButtonNew from '../components/LogoutButtonNew';

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Freelancer CRM – Kunden, Projekte und Aufgaben',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const navLinks = [
  { href: '/crm', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/crm/kunden', label: 'Kunden', icon: Users },
  { href: '/crm/projekte', label: 'Projekte', icon: FolderKanban },
  { href: '/crm/aufgaben', label: 'Aufgaben', icon: CheckSquare },
];

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Freelancer CRM</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">kezar.at</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-violet-600 dark:hover:text-violet-400 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user.username}
                </span>
                {session.user.admin && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
                    Admin
                  </span>
                )}
              </div>
              <LogoutButtonNew />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around py-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
