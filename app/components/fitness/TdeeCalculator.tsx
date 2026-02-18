'use client';

import { useState } from 'react';
import { Flame, ChevronDown } from 'lucide-react';
import type { PersonalData, TdeeResult } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:ring-orange-400/20 dark:focus:border-orange-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

interface TdeeProps extends PersonalData {}

const activityLevels = [
  { label: 'Sitzend (Büroarbeit, wenig Bewegung)', factor: 1.2 },
  { label: 'Leicht aktiv (Sport 1–3 Tage/Woche)', factor: 1.375 },
  { label: 'Moderat aktiv (Sport 3–5 Tage/Woche)', factor: 1.55 },
  { label: 'Sehr aktiv (intensiver Sport 6–7 Tage/Woche)', factor: 1.725 },
  { label: 'Extrem aktiv (Athlet, körperliche Arbeit)', factor: 1.9 },
];

function calcBMR(gender: 'male' | 'female', weight: number, height: number, age: number): number {
  // Mifflin-St Jeor Formel
  return gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

export default function TdeeCalculator({ gender, age, weight, height }: TdeeProps) {
  const [activityFactor, setActivityFactor] = useState<number>(0);

  const hasData = age !== null && weight !== null && height !== null && age > 0 && weight > 0 && height > 0;

  let result: TdeeResult | null = null;
  if (hasData && activityFactor > 0) {
    const bmr = calcBMR(gender, weight!, height!, age!);
    const tdee = bmr * activityFactor;
    result = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      lose: Math.round(tdee - 500),
      maintain: Math.round(tdee),
      gain: Math.round(tdee + 500),
    };
  }

  const bmrOnly = hasData && activityFactor === 0
    ? Math.round(calcBMR(gender, weight!, height!, age!))
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">TDEE – Gesamtenergiebedarf</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Grundumsatz (BMR) × Aktivitätsfaktor. Formel: Mifflin-St Jeor
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Alter, Gewicht und Größe in den persönlichen Daten oben eingeben.
        </div>
      ) : (
        <>
          {/* BMR Zwischenergebnis */}
          {bmrOnly !== null && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Grundumsatz (BMR)</span>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{bmrOnly} kcal/Tag</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Kalorien die dein Körper in absoluter Ruhe verbraucht
              </p>
            </div>
          )}

          {/* Aktivitätslevel */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Aktivitätslevel auswählen <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={activityFactor}
                onChange={(e) => setActivityFactor(parseFloat(e.target.value))}
                className={`${inputClass} appearance-none pr-10 cursor-pointer`}
              >
                <option value={0}>-- Aktivitätslevel wählen --</option>
                {activityLevels.map((a) => (
                  <option key={a.factor} value={a.factor}>{a.label} (×{a.factor})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* TDEE Ergebnis */}
          {result && (
            <div className="animate-scale-in space-y-4">
              {/* Hauptergebnis */}
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-6 text-center text-white shadow-lg shadow-orange-500/25">
                <span className="text-5xl font-extrabold">{result.tdee}</span>
                <span className="block text-sm opacity-80 mt-1 uppercase tracking-wider">kcal / Tag (TDEE)</span>
                <span className="block text-sm opacity-70 mt-1">Grundumsatz: {result.bmr} kcal</span>
              </div>

              {/* Ziel-Kalorien */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Zielkalorien nach Ziel</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide block mb-1">Abnehmen</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.lose}</span>
                    <span className="block text-xs text-blue-500 dark:text-blue-400 mt-0.5">−500 kcal</span>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide block mb-1">Halten</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{result.maintain}</span>
                    <span className="block text-xs text-green-500 dark:text-green-400 mt-0.5">= TDEE</span>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide block mb-1">Zunehmen</span>
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.gain}</span>
                    <span className="block text-xs text-orange-500 dark:text-orange-400 mt-0.5">+500 kcal</span>
                  </div>
                </div>
              </div>

              {/* Formel-Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p className="font-semibold text-gray-600 dark:text-gray-300">Mifflin-St Jeor Formel:</p>
                <p>Männer: 10 × Gewicht + 6.25 × Größe − 5 × Alter + 5</p>
                <p>Frauen: 10 × Gewicht + 6.25 × Größe − 5 × Alter − 161</p>
                <p>TDEE = BMR × Aktivitätsfaktor ({activityFactor})</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
