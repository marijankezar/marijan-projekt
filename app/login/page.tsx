// pages/login.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [passwort, setPasswort] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, passwort }),
      });

      if (res.ok) {
        // Direkte Navigation ohne Next.js Router
        window.location.href = '/dashboard';
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/90 dark:bg-gray-900/80 p-6 shadow-2xl shadow-indigo-500/20 sm:p-8">
        <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Login
        </h1>

        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-center text-base text-red-400 sm:text-lg text-wrap"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Benutzername
            </label>
            <input
              id="login-username"
              type="text"
              placeholder="Benutzername eingeben"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-indigo-500 sm:text-xl"
              aria-required="true"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Passwort
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="Passwort eingeben"
              autoComplete="current-password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-indigo-500 sm:text-xl"
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 py-3 text-lg font-bold text-white transition-all duration-300 hover:bg-indigo-500 hover:scale-105 active:scale-95 sm:py-4 sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2" aria-live="polite">
                <span
                  className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span>WIRD EINGELOGGT…</span>
              </span>
            ) : (
              'EINLOGGEN'
            )}
          </button>
        </form>

        <p
          className="block text-center text-sm font-semibold text-gray-500 dark:text-gray-400 sm:text-base cursor-default"
          aria-label="Passwort vergessen? Bitte kontaktiere den Administrator."
          title="Bitte kontaktiere den Administrator"
        >
          PASSWORT VERGESSEN?
        </p>

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
    </main>
  );
}