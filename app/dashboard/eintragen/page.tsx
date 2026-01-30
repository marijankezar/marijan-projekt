'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Calendar, Clock, Building2, FileText, CheckCircle, AlertCircle,
  Plus, ArrowLeft, Copy, CalendarRange, Repeat, Star, History
} from 'lucide-react';
import Link from 'next/link';

interface Baustelle {
  id: number;
  name: string;
}

interface LetzterEintrag {
  datum: string;
  stunden: number;
  baustelle: string;
  bemerkung: string;
}

export default function EintragenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baustellen, setBaustellen] = useState<Baustelle[]>([]);
  const [showNewBaustelle, setShowNewBaustelle] = useState(false);
  const [letzteEintraege, setLetzteEintraege] = useState<LetzterEintrag[]>([]);
  const [haeufigeBaustellen, setHaeufigeBaustellen] = useState<string[]>([]);

  // Multi-Tag Modus
  const [multiTagModus, setMultiTagModus] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split('T')[0],
    stunden: '',
    baustelle: '',
    neueBaustelle: '',
    bemerkung: ''
  });

  // Baustellen und letzte Einträge laden
  useEffect(() => {
    async function fetchData() {
      try {
        // Baustellen laden
        const baustellenRes = await fetch('/api/baustellen');
        if (baustellenRes.ok) {
          const data = await baustellenRes.json();
          setBaustellen(data);
        }

        // Letzte Einträge laden für "Wiederholen" Feature
        const buchungenRes = await fetch('/api/stundenbuchungen');
        if (buchungenRes.ok) {
          const buchungen = await buchungenRes.json();
          if (Array.isArray(buchungen) && buchungen.length > 0) {
            // Letzte 5 Einträge
            const letzte = buchungen.slice(0, 5).map((b: { datum: string; stunden: number; baustelle: string; platzhalter_text: string }) => ({
              datum: b.datum,
              stunden: b.stunden,
              baustelle: b.baustelle,
              bemerkung: b.platzhalter_text || ''
            }));
            setLetzteEintraege(letzte);

            // Häufigste Baustellen ermitteln
            const baustellenCount: Record<string, number> = {};
            buchungen.forEach((b: { baustelle: string }) => {
              if (b.baustelle) {
                baustellenCount[b.baustelle] = (baustellenCount[b.baustelle] || 0) + 1;
              }
            });
            const sortedBaustellen = Object.entries(baustellenCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name]) => name);
            setHaeufigeBaustellen(sortedBaustellen);
          }
        }
      } catch (err) {
        console.error('Fehler beim Laden:', err);
      }
    }
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  // Letzten Eintrag wiederholen
  const wiederholeLetztenEintrag = (eintrag: LetzterEintrag) => {
    setFormData({
      datum: new Date().toISOString().split('T')[0],
      stunden: eintrag.stunden.toString(),
      baustelle: eintrag.baustelle,
      neueBaustelle: '',
      bemerkung: eintrag.bemerkung
    });
    setShowNewBaustelle(false);
    setError(null);
    setSuccess(false);
  };

  // Datum für Multi-Tag Modus umschalten
  const toggleDate = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  };

  // Woche vorausfüllen (Mo-Fr)
  const fillWorkWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekDates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    setSelectedDates(weekDates);
  };

  // Letzte 7 Tage generieren für Multi-Tag Auswahl
  const getLast7Days = () => {
    const days: { date: string; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
      });
    }
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    const datesToSubmit = multiTagModus ? selectedDates : [formData.datum];

    if (datesToSubmit.length === 0) {
      setError('Bitte mindestens ein Datum auswählen');
      setLoading(false);
      return;
    }

    if (!formData.stunden || parseFloat(formData.stunden) <= 0) {
      setError('Bitte gültige Stundenzahl eingeben');
      setLoading(false);
      return;
    }

    const baustelleName = showNewBaustelle ? formData.neueBaustelle : formData.baustelle;
    if (!baustelleName) {
      setError('Bitte Baustelle auswählen oder neue eingeben');
      setLoading(false);
      return;
    }

    try {
      // Für jeden Tag einen Eintrag erstellen
      const promises = datesToSubmit.map(datum =>
        fetch('/api/stundenbuchungen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datum,
            stunden: parseFloat(formData.stunden),
            baustelle: baustelleName,
            bemerkung: formData.bemerkung
          })
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        // Versuche Details vom ersten fehlgeschlagenen Request zu bekommen
        const firstFailed = results.find(r => !r.ok);
        if (firstFailed) {
          try {
            const errorData = await firstFailed.json();
            let errorText = errorData.error || 'Fehler beim Speichern';
            if (errorData.details) {
              errorText += `: ${errorData.details}`;
            }
            throw new Error(errorText);
          } catch {
            throw new Error(`${failed.length} von ${results.length} Einträgen fehlgeschlagen`);
          }
        }
        throw new Error(`${failed.length} von ${results.length} Einträgen fehlgeschlagen`);
      }

      setSuccess(true);
      setFormData({
        datum: new Date().toISOString().split('T')[0],
        stunden: '',
        baustelle: '',
        neueBaustelle: '',
        bemerkung: ''
      });
      setShowNewBaustelle(false);
      setSelectedDates([]);
      setMultiTagModus(false);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Neuer Eintrag
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Arbeitsstunden erfassen
          </p>
        </div>
      </div>

      {/* Schnellaktionen */}
      {letzteEintraege.length > 0 && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Letzte Einträge wiederholen</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {letzteEintraege.slice(0, 3).map((eintrag, index) => (
              <button
                key={index}
                type="button"
                onClick={() => wiederholeLetztenEintrag(eintrag)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-sm"
              >
                <Copy className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{eintrag.baustelle}</span>
                <span className="text-gray-500 dark:text-gray-400">({eintrag.stunden}h)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Erfolgreich gespeichert!</p>
                <p className="text-sm text-green-600 dark:text-green-400">Sie werden zur Übersicht weitergeleitet...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Multi-Tag Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Mehrere Tage</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gleiche Stunden für mehrere Tage eintragen</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMultiTagModus(!multiTagModus);
                setSelectedDates([]);
              }}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                multiTagModus ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  multiTagModus ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Datum Auswahl */}
          {multiTagModus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  Tage auswählen ({selectedDates.length} gewählt)
                </label>
                <button
                  type="button"
                  onClick={fillWorkWeek}
                  className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <Repeat className="w-4 h-4" />
                  Mo-Fr füllen
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {getLast7Days().map(({ date, label }) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => toggleDate(date)}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedDates.includes(date)
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                Datum
              </label>
              <input
                type="date"
                name="datum"
                value={formData.datum}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Stunden */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              Stunden
            </label>
            <input
              type="number"
              name="stunden"
              value={formData.stunden}
              onChange={handleInputChange}
              placeholder="z.B. 8.5"
              step="0.5"
              min="0"
              max="24"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Quick Hour Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Schnellauswahl Stunden
            </label>
            <div className="flex flex-wrap gap-2">
              {[4, 6, 8, 10, 12].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, stunden: h.toString() }))}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    formData.stunden === h.toString()
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {h} Stunden
                </button>
              ))}
            </div>
          </div>

          {/* Häufige Baustellen */}
          {haeufigeBaustellen.length > 0 && !showNewBaustelle && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Star className="w-4 h-4 text-yellow-500" />
                Häufig verwendet
              </label>
              <div className="flex flex-wrap gap-2">
                {haeufigeBaustellen.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, baustelle: name }))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      formData.baustelle === name
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Baustelle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Building2 className="w-4 h-4" />
                Baustelle
              </label>
              <button
                type="button"
                onClick={() => setShowNewBaustelle(!showNewBaustelle)}
                className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {showNewBaustelle ? 'Vorhandene wählen' : 'Neue Baustelle'}
              </button>
            </div>

            {showNewBaustelle ? (
              <input
                type="text"
                name="neueBaustelle"
                value={formData.neueBaustelle}
                onChange={handleInputChange}
                placeholder="Name der neuen Baustelle"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            ) : (
              <select
                name="baustelle"
                value={formData.baustelle}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Baustelle auswählen...</option>
                {baustellen.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Bemerkung */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4" />
              Bemerkung (optional)
            </label>
            <textarea
              name="bemerkung"
              value={formData.bemerkung}
              onChange={handleInputChange}
              placeholder="Zusätzliche Informationen..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {multiTagModus && selectedDates.length > 1
                    ? `${selectedDates.length} Einträge speichern`
                    : 'Eintrag speichern'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tips Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/50">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Tipps</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Nutzen Sie "Letzte Einträge wiederholen" um schnell ähnliche Einträge zu erstellen</li>
          <li>• Mit "Mehrere Tage" können Sie die gleichen Stunden für eine ganze Woche eintragen</li>
          <li>• Häufig verwendete Baustellen erscheinen automatisch oben</li>
          <li>• Halbe Stunden können als Dezimalzahl eingegeben werden (z.B. 8.5)</li>
        </ul>
      </div>
    </div>
  );
}
