'use client';

import { useState, use } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Fehler');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/90 dark:bg-gray-900/80 p-6 shadow-2xl shadow-indigo-500/20 sm:p-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Neues Passwort setzen
          </h1>
        </div>

        {done ? (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-5 text-center space-y-3">
            <svg className="w-10 h-10 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-green-700 dark:text-green-400">Passwort erfolgreich geändert!</p>
            <Link
              href="/login"
              className="inline-block mt-2 px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
            >
              Zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p role="alert" className="text-center text-sm text-red-400">{error}</p>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Neues Passwort
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Passwort bestätigen
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Passwort wiederholen"
                className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 py-3 text-lg font-bold text-white transition-all duration-300 hover:bg-indigo-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wird gespeichert…
                </span>
              ) : 'Passwort speichern'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4">
            ← Zurück zum Login
          </Link>
        </p>
      </div>
    </main>
  );
}
