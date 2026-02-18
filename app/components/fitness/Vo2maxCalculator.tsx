'use client';

import { useState } from 'react';
import { Wind } from 'lucide-react';
import type { PersonalData, Vo2Method, Vo2maxResult } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

interface Vo2Props extends Pick<PersonalData, 'age' | 'gender'> {}

/** VO2max Kategorien nach Alter und Geschlecht (ml/kg/min) */
const vo2Categories = {
  male: [
    { age: '20–29', excellent: '>52.4', good: '46.4–52.4', avg: '42.5–46.3', below: '36.5–42.4', poor: '<36.5' },
    { age: '30–39', excellent: '>50.4', good: '43.9–50.4', avg: '40.0–43.8', below: '34.4–39.9', poor: '<34.4' },
    { age: '40–49', excellent: '>48.2', good: '42.4–48.2', avg: '37.0–42.3', below: '30.9–36.9', poor: '<30.9' },
    { age: '50–59', excellent: '>45.3', good: '39.2–45.3', avg: '34.6–39.1', below: '29.4–34.5', poor: '<29.4' },
    { age: '60–69', excellent: '>42.5', good: '35.6–42.5', avg: '30.9–35.5', below: '24.5–30.8', poor: '<24.5' },
  ],
  female: [
    { age: '20–29', excellent: '>44.2', good: '38.9–44.2', avg: '35.1–38.8', below: '30.0–35.0', poor: '<30.0' },
    { age: '30–39', excellent: '>41.0', good: '35.7–41.0', avg: '31.5–35.6', below: '26.9–31.4', poor: '<26.9' },
    { age: '40–49', excellent: '>38.9', good: '34.0–38.9', avg: '29.9–33.9', below: '24.5–29.8', poor: '<24.5' },
    { age: '50–59', excellent: '>35.7', good: '31.1–35.7', avg: '26.9–31.0', below: '22.1–26.8', poor: '<22.1' },
    { age: '60–69', excellent: '>32.3', good: '27.0–32.3', avg: '23.1–26.9', below: '19.0–23.0', poor: '<19.0' },
  ],
};

function getVo2Category(vo2: number, gender: 'male' | 'female', age: number | null): Vo2maxResult {
  const thresholds = gender === 'male'
    ? [50, 43, 36, 30]
    : [45, 38, 31, 25];

  // Altersanpassung grob
  const ageAdj = age && age > 40 ? Math.max(0, (age - 40) * 0.3) : 0;
  const adjThresholds = thresholds.map(t => t - ageAdj);

  if (vo2 >= adjThresholds[0]) return { value: vo2, category: 'Hervorragend', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' };
  if (vo2 >= adjThresholds[1]) return { value: vo2, category: 'Gut', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' };
  if (vo2 >= adjThresholds[2]) return { value: vo2, category: 'Durchschnitt', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
  if (vo2 >= adjThresholds[3]) return { value: vo2, category: 'Unterdurchschnitt', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' };
  return { value: vo2, category: 'Schwach', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' };
}

export default function Vo2maxCalculator({ age, gender }: Vo2Props) {
  const [method, setMethod] = useState<Vo2Method>('heartrate');
  // Cooper Test
  const [distance, setDistance] = useState('');
  // Herzfrequenz-Methode
  const [restingHr, setRestingHr] = useState('');

  const maxHR = age ? 220 - age : null;

  let result: Vo2maxResult | null = null;
  let calcError = '';

  if (method === 'cooper') {
    const distNum = parseFloat(distance);
    if (distNum > 0) {
      if (distNum < 500 || distNum > 5000) {
        calcError = 'Bitte eine realistische Distanz zwischen 500 und 5000 Meter eingeben.';
      } else {
        // Cooper-Test: VO2max = (Distanz in Meter - 504.9) / 44.73
        const vo2 = (distNum - 504.9) / 44.73;
        result = getVo2Category(vo2, gender, age);
      }
    }
  } else {
    const rhrNum = parseInt(restingHr);
    if (rhrNum > 0 && maxHR) {
      if (rhrNum < 20 || rhrNum > 200) {
        calcError = 'Bitte einen realistischen Ruhepuls eingeben.';
      } else {
        // Uth-Methode: VO2max = 15 × (MaxHF / Ruhepuls)
        const vo2 = 15 * (maxHR / rhrNum);
        result = getVo2Category(vo2, gender, age);
      }
    }
  }

  // Alterstabelle Zeile ermitteln
  const ageRow = age ? vo2Categories[gender].find((r) => {
    const [low, high] = r.age.split('–').map(Number);
    return age >= low && age <= high;
  }) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
          <Wind className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">VO₂max – Aerobe Fitness</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Maximale Sauerstoffaufnahme – wichtigster Indikator für kardiovaskuläre Fitness
          </p>
        </div>
      </div>

      {/* Methode wählen */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Berechnungsmethode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMethod('heartrate')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              method === 'heartrate'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.02]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Herzfrequenz-Methode (Uth)
          </button>
          <button
            onClick={() => setMethod('cooper')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              method === 'cooper'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.02]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Cooper-Test (12-Min-Lauf)
          </button>
        </div>
      </div>

      {/* Eingaben je Methode */}
      {method === 'heartrate' ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Ruhepuls (bpm) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="20" max="200"
              placeholder="z.B. 60"
              value={restingHr}
              onChange={(e) => setRestingHr(e.target.value)}
              className={inputClass}
            />
          </div>
          {maxHR ? (
            <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-3 text-sm text-cyan-800 dark:text-cyan-300">
              Maximalpuls (220 − {age}): <span className="font-bold">{maxHR} bpm</span>
              <span className="block text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                Formel: VO₂max = 15 × (MaxHF / Ruhepuls)
              </span>
            </div>
          ) : (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              Alter oben eingeben, um den Maximalpuls zu berechnen.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Zurückgelegte Distanz in 12 Minuten (Meter) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="500" max="5000" step="10"
              placeholder="z.B. 2400"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-3 text-xs text-cyan-800 dark:text-cyan-300">
            <p className="font-semibold mb-1">Cooper-Test Durchführung:</p>
            <p>12 Minuten so weit wie möglich laufen (kein Walking). Die zurückgelegte Strecke in Meter eintragen.</p>
            <p className="mt-1">Formel: VO₂max = (Distanz − 504.9) ÷ 44.73</p>
          </div>
        </div>
      )}

      {/* Fehler */}
      {calcError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {calcError}
        </div>
      )}

      {/* Ergebnis */}
      {result && (
        <div className="animate-scale-in space-y-4">
          <div className={`${result.bg} rounded-xl p-6 text-center`}>
            <span className={`text-5xl font-extrabold ${result.color}`}>{result.value.toFixed(1)}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">ml/kg/min (VO₂max)</span>
            <span className={`block mt-2 text-lg font-semibold ${result.color}`}>{result.category}</span>
          </div>

          {/* Referenztabelle */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              VO₂max Referenzwerte ({gender === 'male' ? 'Männer' : 'Frauen'})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300 rounded-tl-lg">Altersgruppe</th>
                    <th className="px-3 py-2 text-center text-green-600 dark:text-green-400">Hervorragend</th>
                    <th className="px-3 py-2 text-center text-teal-600 dark:text-teal-400">Gut</th>
                    <th className="px-3 py-2 text-center text-yellow-600 dark:text-yellow-400">Durchschn.</th>
                    <th className="px-3 py-2 text-center text-orange-600 dark:text-orange-400">Unter Durchs.</th>
                    <th className="px-3 py-2 text-center text-red-600 dark:text-red-400 rounded-tr-lg">Schwach</th>
                  </tr>
                </thead>
                <tbody>
                  {vo2Categories[gender].map((row, i) => (
                    <tr
                      key={row.age}
                      className={`border-t border-gray-100 dark:border-gray-700 ${
                        ageRow?.age === row.age ? 'bg-cyan-50 dark:bg-cyan-900/20 font-semibold' : i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        {row.age} {ageRow?.age === row.age && <span className="text-cyan-500">◀</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-green-600 dark:text-green-400">{row.excellent}</td>
                      <td className="px-3 py-2 text-center text-teal-600 dark:text-teal-400">{row.good}</td>
                      <td className="px-3 py-2 text-center text-yellow-600 dark:text-yellow-400">{row.avg}</td>
                      <td className="px-3 py-2 text-center text-orange-600 dark:text-orange-400">{row.below}</td>
                      <td className="px-3 py-2 text-center text-red-600 dark:text-red-400">{row.poor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!result && !calcError && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          {method === 'heartrate'
            ? 'Ruhepuls eingeben (und Alter in persönlichen Daten), um VO₂max zu schätzen.'
            : '12-Minuten-Distanz aus dem Cooper-Test eingeben.'}
        </div>
      )}
    </div>
  );
}
