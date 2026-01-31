import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import React from "react";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, Clock, User } from "lucide-react";
import LogoutButtonNew from "../components/LogoutButtonNew";

// Verhindert Caching - Session wird bei jedem Request geprüft
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Stundenverwaltung</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">kezar.at</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Übersicht</span>
              </Link>
              <Link
                href="/dashboard/eintragen"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Neuer Eintrag</span>
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user.username}
                </span>
                {session.user.admin && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    Admin
                  </span>
                )}
              </div>
              <LogoutButtonNew />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">Übersicht</span>
          </Link>
          <Link
            href="/dashboard/eintragen"
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-xs">Eintragen</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}


