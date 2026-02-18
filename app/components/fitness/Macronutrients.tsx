'use client';

import { useState } from 'react';
import { Utensils, ChevronDown } from 'lucide-react';
import type { PersonalData } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-400/20 dark:focus:border-emerald-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

const activityLevels = [
  { label: 'Sitzend (Büroarbeit)', factor: 1.2 },
  { label: 'Leicht aktiv (1–3 Tage/Woche)', factor: 1.375 },
  { label: 'Moderat aktiv (3–5 Tage/Woche)', factor: 1.55 },
  { label: 'Sehr aktiv (6–7 Tage/Woche)', factor: 1.725 },
  { label: 'Extrem aktiv (Athlet)', factor: 1.9 },
];

type MacroGoal = 'lose' | 'maintain' | 'gain';

interface MacrosProps extends PersonalData {}

export default function Macronutrients({ gender, age, weight, height }: MacrosProps) {
  const [activityFactor, setActivityFactor] = useState<number>(0);
  const [goal, setGoal] = useState<MacroGoal>('maintain');

  const hasData = age && weight && height && age > 0 && weight > 0 && height > 0;

  let tdee: number | null = null;
  if (hasData && activityFactor > 0) {
    const bmr = gender === 'male'
      ? 10 * weight! + 6.25 * height! - 5 * age! + 5
      : 10 * weight! + 6.25 * height! - 5 * age! - 161;
    tdee = bmr * activityFactor;
  }

  const targetCalories = tdee
    ? goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee
    : null;

  const macros = targetCalories && weight ? (() => {
    const proteinG = Math.round(weight! * (goal === 'gain' ? 2.2 : goal === 'lose' ? 2.0 : 1.8));
    const fatG = Math.round((targetCalories * 0.28) / 9);
    const carbsG = Math.max(Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4), 0);
    return { proteinG, fatG, carbsG, total: targetCalories };
  })() : null;

  const goals: { id: MacroGoal; label: string; color: string; active: string }[] = [
    { id: 'lose', label: 'Abnehmen', color: 'text-blue-600 dark:text-blue-400', active: 'from-blue-500 to-blue-600' },
    { id: 'maintain', label: 'Halten', color: 'text-green-600 dark:text-green-400', active: 'from-green-500 to-emerald-600' },
    { id: 'gain', label: 'Aufbauen', color: 'text-orange-600 dark:text-orange-400', active: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
          <Utensils className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Makronährstoffe</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Protein-, Kohlenhydrat- & Fettverteilung basierend auf TDEE und Ziel
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Alter, Gewicht und Größe in den persönlichen Daten oben eingeben.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aktivitätslevel */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Aktivitätslevel <span className="text-red-500">*</span>
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

            {/* Ziel */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ziel</label>
              <div className="flex gap-2">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`flex-1 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      goal === g.id
                        ? `bg-gradient-to-r ${g.active} text-white shadow-md scale-[1.02]`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ergebnis */}
          {macros && tdee ? (
            <div className="animate-scale-in space-y-4">
              {/* TDEE Übersicht */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">TDEE</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Gesamtenergiebedarf</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Math.round(tdee)} kcal</span>
              </div>

              {/* Zielkalorien + Makros */}
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg shadow-emerald-500/25">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold opacity-80">
                    Zielkalorien ({goal === 'lose' ? 'Abnehmen −500' : goal === 'gain' ? 'Aufbauen +300' : 'Halten'})
                  </span>
                  <span className="text-3xl font-extrabold">{macros.total} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Protein', g: macros.proteinG, kcal: macros.proteinG * 4, color: 'bg-white/20' },
                    { label: 'Kohlenhydrate', g: macros.carbsG, kcal: macros.carbsG * 4, color: 'bg-white/20' },
                    { label: 'Fett', g: macros.fatG, kcal: macros.fatG * 9, color: 'bg-white/20' },
                  ].map((m) => (
                    <div key={m.label} className={`${m.color} rounded-xl p-3 text-center`}>
                      <span className="text-2xl font-extrabold">{m.g}g</span>
                      <span className="block text-xs opacity-80 mt-0.5">{m.label}</span>
                      <span className="block text-xs opacity-60">{m.kcal} kcal</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balkendiagramm */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kalorienverteilung</p>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                  <div
                    className="bg-blue-400 transition-all duration-500"
                    style={{ width: `${((macros.proteinG * 4) / macros.total * 100).toFixed(0)}%` }}
                    title={`Protein: ${((macros.proteinG * 4) / macros.total * 100).toFixed(0)}%`}
                  />
                  <div
                    className="bg-emerald-400 transition-all duration-500"
                    style={{ width: `${((macros.carbsG * 4) / macros.total * 100).toFixed(0)}%` }}
                    title={`Kohlenhydrate: ${((macros.carbsG * 4) / macros.total * 100).toFixed(0)}%`}
                  />
                  <div
                    className="bg-yellow-400 flex-1"
                    title="Fett"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Protein {((macros.proteinG * 4) / macros.total * 100).toFixed(0)}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Carbs {((macros.carbsG * 4) / macros.total * 100).toFixed(0)}%</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Fett {((macros.fatG * 9) / macros.total * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              Aktivitätslevel auswählen, um die Makronährstoffe zu berechnen.
            </div>
          )}
        </>
      )}
    </div>
  );
}
