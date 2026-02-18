'use client';

import { useState } from 'react';
import { Percent } from 'lucide-react';
import type { PersonalData } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:ring-purple-400/20 dark:focus:border-purple-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

interface BodyFatProps extends Pick<PersonalData, 'gender' | 'height'> {}

interface CategoryInfo {
  label: string;
  color: string;
  bg: string;
}

function getBodyFatCategory(bf: number, gender: 'male' | 'female'): CategoryInfo {
  const male = gender === 'male';
  if (bf < (male ? 6 : 14))   return { label: 'Lebensnotwendig', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' };
  if (bf < (male ? 14 : 21))  return { label: 'Athleten', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' };
  if (bf < (male ? 18 : 25))  return { label: 'Fitness', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' };
  if (bf < (male ? 25 : 32))  return { label: 'Durchschnitt', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
  return                        { label: 'Über Durchschnitt', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' };
}

export default function BodyFatCalculator({ gender, height }: BodyFatProps) {
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [error, setError] = useState('');

  const neckNum = parseFloat(neck);
  const waistNum = parseFloat(waist);
  const hipNum = parseFloat(hip);
  const heightNum = height ?? 0;

  let bodyFat: number | null = null;
  let calcError = '';

  if (heightNum > 0 && neckNum > 0 && waistNum > 0) {
    if (gender === 'male') {
      if (waistNum <= neckNum) {
        calcError = 'Bauchmaß muss größer als Halsmaß sein.';
      } else {
        // U.S. Navy Formel Männer
        bodyFat = 86.010 * Math.log10(waistNum - neckNum) - 70.041 * Math.log10(heightNum) + 36.76;
      }
    } else {
      if (hipNum <= 0) {
        calcError = 'Bitte Hüftumfang angeben (erforderlich für Frauen).';
      } else if ((waistNum + hipNum) <= neckNum) {
        calcError = 'Ungültige Messungen – bitte Werte prüfen.';
      } else {
        // U.S. Navy Formel Frauen
        bodyFat = 163.205 * Math.log10(waistNum + hipNum - neckNum) - 97.684 * Math.log10(heightNum) - 78.387;
      }
    }
  }

  const result = bodyFat !== null && bodyFat > 0 && bodyFat < 70 ? bodyFat : null;
  const category = result !== null ? getBodyFatCategory(result, gender) : null;

  // Bewertungsskala
  const maleRanges = [
    { label: 'Lebensnotwendig', range: '2–5%', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Athleten', range: '6–13%', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Fitness', range: '14–17%', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/30' },
    { label: 'Durchschnitt', range: '18–24%', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
    { label: 'Über Durchs.', range: '≥ 25%', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  ];
  const femaleRanges = [
    { label: 'Lebensnotwendig', range: '10–13%', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Athleten', range: '14–20%', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Fitness', range: '21–24%', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/30' },
    { label: 'Durchschnitt', range: '25–31%', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
    { label: 'Über Durchs.', range: '≥ 32%', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  ];
  const ranges = gender === 'male' ? maleRanges : femaleRanges;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
          <Percent className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Körperfettanteil</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Schätzung via U.S. Navy-Methode aus Körpermaßen (kein Equipment nötig)
          </p>
        </div>
      </div>

      {/* Eingaben */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Halsumfang (cm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="20" max="80" step="0.1"
            placeholder="z.B. 38"
            value={neck}
            onChange={(e) => setNeck(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">Unterhalb des Kehlkopfes messen</span>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Bauchumfang (cm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="40" max="200" step="0.1"
            placeholder="z.B. 85"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {gender === 'male' ? 'Auf Nabelhöhe messen' : 'Schmalste Stelle des Bauches'}
          </span>
        </div>
        {gender === 'female' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Hüftumfang (cm) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="50" max="200" step="0.1"
              placeholder="z.B. 95"
              value={hip}
              onChange={(e) => setHip(e.target.value)}
              className={inputClass}
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">Breiteste Stelle der Hüfte</span>
          </div>
        )}
        {!height && (
          <div className="sm:col-span-2">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-300">
              Bitte Körpergröße in den persönlichen Daten oben eintragen.
            </div>
          </div>
        )}
      </div>

      {/* Fehler */}
      {calcError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {calcError}
        </div>
      )}

      {/* Ergebnis */}
      {result !== null && category && (
        <div className="animate-scale-in space-y-4">
          <div className={`${category.bg} rounded-xl p-6 text-center`}>
            <span className={`text-5xl font-extrabold ${category.color}`}>{result.toFixed(1)}%</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Körperfett</span>
            <span className={`block mt-2 text-lg font-semibold ${category.color}`}>{category.label}</span>
          </div>

          {/* Bewertungsskala */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Bewertungsskala ({gender === 'male' ? 'Männer' : 'Frauen'})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {ranges.map((r) => (
                <div key={r.label} className={`${r.bg} rounded-lg p-2 text-center`}>
                  <span className={`font-semibold ${r.color}`}>{r.range}</span>
                  <span className="block text-gray-600 dark:text-gray-400 mt-0.5">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !calcError && neckNum > 0 && waistNum > 0 && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-3">
          Ergebnis wird berechnet sobald alle Pflichtfelder ausgefüllt sind.
        </div>
      )}

      {!neckNum && !waistNum && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Körpermaße eingeben, um den Körperfettanteil zu berechnen.
        </div>
      )}
    </div>
  );
}
