'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const inputCls =
  "w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg " +
  "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 " +
  "focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none " +
  "focus-visible:outline-2 focus-visible:outline-indigo-500 sm:text-xl";

const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    passwort: '',
    passwortWdh: '',
    email: '',
    vorname: '',
    nachname: '',
    adresse: '',
    geburtsdatum: '',
    geschlecht: 'andere',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.passwort !== formData.passwortWdh) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      router.push('/login');
    } else {
      const data = await res.json();
      setError(data.error || 'Fehler bei der Registrierung.');
    }
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 p-4"
    >
      <div className="w-full max-w-xl space-y-8 rounded-xl bg-white/90 dark:bg-gray-900/80 p-6 shadow-2xl shadow-indigo-500/20 sm:p-8">
        <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Neuen Account erstellen
        </h1>

        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-center text-base text-red-400 sm:text-lg"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          noValidate
          aria-describedby={error ? 'reg-error-summary' : undefined}
        >
          <div>
            <label htmlFor="reg-username" className={labelCls}>
              Benutzername <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="reg-username"
              name="username"
              type="text"
              placeholder="Benutzername eingeben"
              autoComplete="username"
              required
              aria-required="true"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className={labelCls}>
              E-Mail <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="E-Mail-Adresse eingeben"
              autoComplete="email"
              required
              aria-required="true"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-passwort" className={labelCls}>
              Passwort <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="reg-passwort"
              name="passwort"
              type="password"
              placeholder="Passwort eingeben"
              autoComplete="new-password"
              required
              aria-required="true"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-passwortWdh" className={labelCls}>
              Passwort wiederholen <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="reg-passwortWdh"
              name="passwortWdh"
              type="password"
              placeholder="Passwort bestätigen"
              autoComplete="new-password"
              required
              aria-required="true"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-vorname" className={labelCls}>Vorname</label>
            <input
              id="reg-vorname"
              name="vorname"
              type="text"
              placeholder="Vorname eingeben"
              autoComplete="given-name"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-nachname" className={labelCls}>Nachname</label>
            <input
              id="reg-nachname"
              name="nachname"
              type="text"
              placeholder="Nachname eingeben"
              autoComplete="family-name"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-adresse" className={labelCls}>Adresse</label>
            <input
              id="reg-adresse"
              name="adresse"
              type="text"
              placeholder="Adresse eingeben"
              autoComplete="street-address"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-geburtsdatum" className={labelCls}>Geburtsdatum</label>
            <input
              id="reg-geburtsdatum"
              name="geburtsdatum"
              type="date"
              autoComplete="bday"
              className={inputCls}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="reg-geschlecht" className={labelCls}>Geschlecht</label>
            <select
              id="reg-geschlecht"
              name="geschlecht"
              autoComplete="sex"
              className={inputCls}
              onChange={handleChange}
              value={formData.geschlecht}
            >
              <option value="männlich" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                Männlich
              </option>
              <option value="weiblich" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                Weiblich
              </option>
              <option value="andere" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                Andere
              </option>
            </select>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span aria-hidden="true" className="text-red-500">*</span> Pflichtfelder
          </p>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-3 text-lg font-bold text-white
                       transition-all duration-300 hover:bg-indigo-500 hover:scale-105 active:scale-95
                       sm:py-4 sm:text-xl
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            REGISTRIEREN
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Bereits ein Konto?{' '}
          <a
            href="/login"
            className="font-medium text-indigo-600 dark:text-indigo-400 underline-offset-4
                       transition-colors duration-300 hover:underline hover:text-indigo-500
                       dark:hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-indigo-500 rounded"
          >
            Jetzt einloggen
          </a>
        </p>

        <div className="text-center">
          <a
            href="https://kezar.at"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="kezar.at — Website von Marijan Kežar BSc (öffnet in neuem Tab)"
            className="inline-block text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                       font-semibold text-sm sm:text-base tracking-wide transition-colors"
          >
            2026 Marijan Kežar BSc | www.kezar.at
          </a>
        </div>
      </div>
    </main>
  );
}
