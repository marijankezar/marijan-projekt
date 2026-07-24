'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2, Sailboat } from 'lucide-react';
import { registerSchema } from '@/lib/regatta-validation';

interface EventSummary {
  id: string;
  name: string;
}

interface BoatClassOption {
  id: string;
  name: string;
}

interface CrewForm {
  firstName: string;
  lastName: string;
  nation: string;
  birthYear: string;
}

const EMPTY_CREW: CrewForm = { firstName: '', lastName: '', nation: '', birthYear: '' };
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventSummary | null>(null);
  const [boatClasses, setBoatClasses] = useState<BoatClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Persönliche Daten (Skipper)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nation, setNation] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Bootsdaten
  const [boatClassId, setBoatClassId] = useState('');
  const [boatName, setBoatName] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [startNumber, setStartNumber] = useState('');

  // Crew (bis zu 4 weitere Personen)
  const [crew, setCrew] = useState<CrewForm[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [eventRes, classesRes] = await Promise.all([
        fetch(`/api/regatta/events/${id}`),
        fetch('/api/regatta/boat-classes'),
      ]);
      if (eventRes.ok) setEvent(await eventRes.json());
      if (classesRes.ok) {
        const body = await classesRes.json();
        setBoatClasses(body.rows);
        if (body.rows.length > 0) setBoatClassId(body.rows[0].id);
      }
      setLoading(false);
    })();
  }, [id]);

  function updateCrew(index: number, patch: Partial<CrewForm>) {
    setCrew((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({
      eventId: id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nation: nation.trim(),
      birthYear: Number(birthYear),
      email: email.trim(),
      password,
      boatClassId,
      boatName: boatName.trim(),
      sailNumber: sailNumber.trim(),
      startNumber: startNumber.trim(),
      crew: crew.map((c) => ({
        firstName: c.firstName.trim(),
        lastName: c.lastName.trim(),
        nation: c.nation.trim(),
        birthYear: Number(c.birthYear),
      })),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Ungültige Eingabe');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/regatta/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Registrierung fehlgeschlagen');
      }
      router.push('/regatta/tracking');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/regatta/events"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sailboat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Anmeldung</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{event?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <section className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Persönliche Daten (Skipper) <span className="text-xs font-normal text-gray-400">— Kapitän des Boots</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Vorname</label>
                <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nachname</label>
                <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nation</label>
                <input required value={nation} onChange={(e) => setNation(e.target.value)} placeholder="z.B. AUT" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Geburtsjahr</label>
                <input
                  required
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>E-Mail (für Login)</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Passwort</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min. 6 Zeichen"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Bootsdaten</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Bootsklasse</label>
                <select required value={boatClassId} onChange={(e) => setBoatClassId(e.target.value)} className={inputClass}>
                  {boatClasses.map((bc) => (
                    <option key={bc.id} value={bc.id}>
                      {bc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Bootsname</label>
                <input required value={boatName} onChange={(e) => setBoatName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Segelnummer</label>
                <input required value={sailNumber} onChange={(e) => setSailNumber(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Startnummer</label>
                <input required value={startNumber} onChange={(e) => setStartNumber(e.target.value)} className={inputClass} />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Crew <span className="text-xs font-normal text-gray-400">— bis zu 4 weitere Personen</span>
              </h2>
              <button
                type="button"
                disabled={crew.length >= 4}
                onClick={() => setCrew((prev) => [...prev, { ...EMPTY_CREW }])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Plus className="w-4 h-4" />
                Crewmitglied
              </button>
            </div>

            {crew.map((c, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 first:pt-0 first:border-0">
                <div className="col-span-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">Crewmitglied {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => setCrew((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600"
                    aria-label="Entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className={labelClass}>Vorname</label>
                  <input required value={c.firstName} onChange={(e) => updateCrew(i, { firstName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nachname</label>
                  <input required value={c.lastName} onChange={(e) => updateCrew(i, { lastName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nation</label>
                  <input required value={c.nation} onChange={(e) => updateCrew(i, { nation: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Geburtsjahr</label>
                  <input
                    required
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={c.birthYear}
                    onChange={(e) => updateCrew(i, { birthYear: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            {crew.length === 0 && (
              <p className="text-sm text-gray-400">Keine weiteren Crewmitglieder — Boot wird nur mit Skipper gemeldet.</p>
            )}
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Jetzt anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
