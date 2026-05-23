'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Fehler');
      }
      setSent(true);
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Passwort vergessen?
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Gib deine E-Mail-Adresse ein — wir schicken dir einen Reset-Link.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-5 text-center space-y-2">
            <svg className="w-10 h-10 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-green-700 dark:text-green-400">E-Mail wurde gesendet!</p>
            <p className="text-sm text-green-600 dark:text-green-500">
              Falls ein Konto mit dieser Adresse existiert, bekommst du in Kürze einen Reset-Link. Der Link ist 1 Stunde gültig.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p role="alert" className="text-center text-sm text-red-400">{error}</p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.at"
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
                  Wird gesendet…
                </span>
              ) : 'Reset-Link senden'}
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
