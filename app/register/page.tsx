'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 dark:from-black dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-xl space-y-8 rounded-xl bg-white/90 dark:bg-gray-900/80 p-6 shadow-2xl shadow-indigo-500/20 sm:p-8">
        <div className="text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Neuen Account erstellen
        </div>

        {error && (
          <p className="text-center text-base text-red-400 sm:text-lg">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="reg-username" className="sr-only">Benutzername</label>
            <input
              id="reg-username"
              name="username"
              placeholder="Benutzername"
              required
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-email" className="sr-only">E-Mail</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              placeholder="E-Mail"
              required
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-passwort" className="sr-only">Passwort</label>
            <input
              id="reg-passwort"
              name="passwort"
              type="password"
              placeholder="Passwort"
              required
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-passwortWdh" className="sr-only">Passwort wiederholen</label>
            <input
              id="reg-passwortWdh"
              name="passwortWdh"
              type="password"
              placeholder="Passwort wiederholen"
              required
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-vorname" className="sr-only">Vorname</label>
            <input
              id="reg-vorname"
              name="vorname"
              placeholder="Vorname"
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-nachname" className="sr-only">Nachname</label>
            <input
              id="reg-nachname"
              name="nachname"
              placeholder="Nachname"
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-adresse" className="sr-only">Adresse</label>
            <input
              id="reg-adresse"
              name="adresse"
              placeholder="Adresse"
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-geburtsdatum" className="sr-only">Geburtsdatum</label>
            <input
              id="reg-geburtsdatum"
              name="geburtsdatum"
              type="date"
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
              onChange={handleChange}
            />
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <div className="relative">
            <label htmlFor="reg-geschlecht" className="sr-only">Geschlecht</label>
            <select
              id="reg-geschlecht"
              name="geschlecht"
              className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent py-3 text-lg text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none sm:text-xl"
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
            <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-500 dark:bg-indigo-400 transition-transform duration-300 focus-within:scale-x-100" />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-3 text-lg font-bold text-white transition-all duration-300 hover:bg-indigo-500 hover:scale-105 active:scale-95 sm:py-4 sm:text-xl"
          >
            REGISTRIEREN
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Bereits ein Konto?{' '}
          <a
            href="/login"
            className="font-medium text-indigo-600 dark:text-indigo-400 underline-offset-4 transition-colors duration-300 hover:underline hover:text-indigo-500 dark:hover:text-indigo-300"
          >
            Jetzt einloggen
          </a>
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