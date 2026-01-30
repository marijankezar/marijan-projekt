// pages/login.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [passwort, setPasswort] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, passwort }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        let errorText = data.error || 'Login fehlgeschlagen';
        if (data.details) {
          errorText += ` (${data.details})`;
        }
        setError(errorText);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(`Fehler beim Verbinden mit dem Server: ${errorMsg}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/90 dark:bg-gray-900/80 p-6 shadow-2xl shadow-indigo-500/20 sm:p-8">
        <div className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Login
        </div>

        {error && (
          <p className="text-center text-base text-red-400 sm:text-lg text-wrap">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Passwort"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-3 text-lg font-bold text-white transition-all duration-300 hover:bg-indigo-500 hover:scale-105 active:scale-95 sm:py-4 sm:text-xl"
          >
            EINLOGGEN
          </button>
        </form>

        <a
          href="#"
          className="block text-center text-sm font-semibold text-gray-500 dark:text-gray-400 transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300 sm:text-base"
        >
          PASSWORT VERGESSEN?
        </a>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Kein Konto?{' '}
          <Link
            href="/register"
            className="font-medium text-indigo-600 dark:text-indigo-400 underline-offset-4 transition-colors duration-300 hover:underline hover:text-indigo-500 dark:hover:text-indigo-300"
          >
            Konto erstellen
          </Link>
        </p>
        <div className="text-center">
          <a
            href="https://kezar.at"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-semibold text-sm sm:text-base tracking-wide transition-colors"
          >
            2026 Marijan Kežar BSc | www.kezar.at
          </a>
        </div>
      </div>
    </div>
  );
}