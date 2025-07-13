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
  <div className="max-w-xl mx-auto mt-10 p-6 border rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Neuen Account erstellen</h1>


      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">


        <input
          name="username"
          placeholder="Benutzername"
          required
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="email"
          type="email"
          placeholder="E-Mail"
          required
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="passwort"
          type="password"
          placeholder="Passwort"
          required
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="passwortWdh"
          type="password"
          placeholder="Passwort wiederholen"
          required
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="vorname"
          placeholder="Vorname"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="nachname"
          placeholder="Nachname"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="adresse"
          placeholder="Adresse"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <input
          name="geburtsdatum"
          type="date"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <select
          name="geschlecht"
          className="w-full p-2 border rounded"
          onChange={handleChange}
          value={formData.geschlecht}
        >
          <option value="männlich">Männlich</option>
          <option value="weiblich">Weiblich</option>
          <option value="andere">Andere</option>
        </select>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Registrieren
        </button>
      </form>
    </div>
  );
}
