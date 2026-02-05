'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, User, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function TimeBookLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gesperrt, setGesperrt] = useState(false);
  const [verbleibendeVersuche, setVerbleibendeVersuche] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/timebook/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/timebook';
      } else {
        setError(data.error || 'Login fehlgeschlagen');

        if (data.gesperrt) {
          setGesperrt(true);
        }

        if (data.versuche_verbleibend !== undefined) {
          setVerbleibendeVersuche(data.versuche_verbleibend);
        }
      }
    } catch (err) {
      setError('Fehler beim Verbinden mit dem Server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">TimeBook</h1>
          <p className="text-purple-200 mt-2">Zeiterfassung & Projektverwaltung</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-semibold text-white text-center mb-6">Anmelden</h2>

          {error && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
              gesperrt
                ? 'bg-red-500/20 border border-red-500/50'
                : 'bg-yellow-500/20 border border-yellow-500/50'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${gesperrt ? 'text-red-400' : 'text-yellow-400'}`} />
              <div>
                <p className={gesperrt ? 'text-red-200' : 'text-yellow-200'}>{error}</p>
                {verbleibendeVersuche !== null && verbleibendeVersuche > 0 && (
                  <p className="text-yellow-300 text-sm mt-1">
                    Noch {verbleibendeVersuche} Versuch(e) übrig
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Benutzername oder E-Mail
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  placeholder="Benutzername eingeben"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="password"
                  placeholder="Passwort eingeben"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || gesperrt}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Anmelden...
                </>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-purple-200">
              Noch kein Konto?{' '}
              <Link
                href="/timebook/register"
                className="text-white font-medium hover:text-purple-300 underline underline-offset-4 transition-colors"
              >
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-purple-300 hover:text-white text-sm transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>

        <div className="mt-4 text-center">
          <a
            href="https://kezar.at"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            © 2026 kezar.at
          </a>
        </div>
      </div>
    </div>
  );
}
