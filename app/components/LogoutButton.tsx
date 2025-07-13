// components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (confirm('Möchtest du dich wirklich abmelden?')) {
      try {
        const res = await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (res.ok) router.push('/login');
        else setError('Fehler beim Ausloggen');
      } catch (err) {
        setError('Fehler beim Ausloggen');
      }
    }
  };

  return (
    <div className="flex justify-center">
      {error && (
        <p className="text-center text-base text-red-400 sm:text-lg mb-4">
          {error}
        </p>
      )}
      <button
        onClick={handleLogout}
        className="w-40 rounded-md bg-indigo-600 px-4 py-4 text-base font-bold text-white transition-all duration-300 hover:bg-indigo-500 hover:scale-105 active:scale-95 sm:px-6 sm:py-5 sm:text-lg"
      >
        ABMELDEN
      </button>
    </div>
  );
}