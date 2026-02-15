'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutButtonNew() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch {
      // Ignoriere Fehler - wir leiten trotzdem weiter
    }

    // Immer zur Login-Seite weiterleiten
    window.location.href = '/login';
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 disabled:opacity-50"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">{loading ? 'Abmelden...' : 'Abmelden'}</span>
    </button>
  );
}
