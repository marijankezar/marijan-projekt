'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, User, Lock, Mail, AlertCircle, Loader2, Check, UserPlus } from 'lucide-react';

export default function TimeBookRegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    vorname: '',
    nachname: ''
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    if (formData.username.length < 3) {
      validationErrors.push('Benutzername muss mindestens 3 Zeichen haben');
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      validationErrors.push('Benutzername darf nur Buchstaben, Zahlen, Punkte, Unterstriche und Bindestriche enthalten');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.push('Bitte eine gültige E-Mail-Adresse eingeben');
    }

    if (formData.password.length < 8) {
      validationErrors.push('Passwort muss mindestens 8 Zeichen haben');
    }

    if (!/[A-Z]/.test(formData.password)) {
      validationErrors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
    }

    if (!/[a-z]/.test(formData.password)) {
      validationErrors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }

    if (!/[0-9]/.test(formData.password)) {
      validationErrors.push('Passwort muss mindestens eine Zahl enthalten');
    }

    if (formData.password !== formData.passwordConfirm) {
      validationErrors.push('Passwörter stimmen nicht überein');
    }

    return validationErrors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors([]);

    // Client-seitige Validierung
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/timebook/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          vorname: formData.vorname || null,
          nachname: formData.nachname || null
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        if (data.details && Array.isArray(data.details)) {
          setErrors(data.details);
        } else {
          setError(data.error || 'Registrierung fehlgeschlagen');
        }
      }
    } catch (err) {
      setError('Fehler beim Verbinden mit dem Server');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Erfolgs-Ansicht
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
        <div className="relative w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Registrierung erfolgreich!</h2>
            <p className="text-purple-200 mb-8">
              Dein Konto wurde erstellt. Du kannst dich jetzt anmelden.
            </p>
            <Link
              href="/timebook/login"
              className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
            >
              Zum Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TimeBook</h1>
          <p className="text-purple-200 mt-1">Neues Konto erstellen</p>
        </div>

        {/* Register Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-6">
            <UserPlus className="w-6 h-6 text-purple-300" />
            <h2 className="text-xl font-semibold text-white">Registrieren</h2>
          </div>

          {/* Errors */}
          {(error || errors.length > 0) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  {error && <p className="text-red-200">{error}</p>}
                  {errors.length > 0 && (
                    <ul className="text-red-200 text-sm space-y-1">
                      {errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1.5">
                  Vorname
                </label>
                <input
                  type="text"
                  placeholder="Max"
                  value={formData.vorname}
                  onChange={(e) => updateForm('vorname', e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-1.5">
                  Nachname
                </label>
                <input
                  type="text"
                  placeholder="Mustermann"
                  value={formData.nachname}
                  onChange={(e) => updateForm('nachname', e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-1.5">
                Benutzername <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  placeholder="max.mustermann"
                  value={formData.username}
                  onChange={(e) => updateForm('username', e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-1.5">
                E-Mail <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="email"
                  placeholder="max@example.com"
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-1.5">
                Passwort <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="password"
                  placeholder="Min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl"
                  value={formData.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Confirm */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-1.5">
                Passwort bestätigen <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={formData.passwordConfirm}
                  onChange={(e) => updateForm('passwordConfirm', e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-purple-300 text-xs font-medium mb-2">Passwort-Anforderungen:</p>
              <ul className="text-xs space-y-1">
                <li className={formData.password.length >= 8 ? 'text-green-400' : 'text-purple-300/60'}>
                  {formData.password.length >= 8 ? '✓' : '○'} Mindestens 8 Zeichen
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-purple-300/60'}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'} Ein Großbuchstabe
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-purple-300/60'}>
                  {/[a-z]/.test(formData.password) ? '✓' : '○'} Ein Kleinbuchstabe
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-purple-300/60'}>
                  {/[0-9]/.test(formData.password) ? '✓' : '○'} Eine Zahl
                </li>
                <li className={formData.password === formData.passwordConfirm && formData.passwordConfirm.length > 0 ? 'text-green-400' : 'text-purple-300/60'}>
                  {formData.password === formData.passwordConfirm && formData.passwordConfirm.length > 0 ? '✓' : '○'} Passwörter stimmen überein
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrieren...
                </>
              ) : (
                'Konto erstellen'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-purple-200 text-sm">
              Bereits ein Konto?{' '}
              <Link
                href="/timebook/login"
                className="text-white font-medium hover:text-purple-300 underline underline-offset-4 transition-colors"
              >
                Anmelden
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-purple-300 hover:text-white text-sm transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
