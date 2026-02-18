'use client';

import { useState } from 'react';
import { Dumbbell, ChevronDown } from 'lucide-react';
import type { OneRmResult } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-red-500/20 focus:border-red-500 dark:focus:ring-red-400/20 dark:focus:border-red-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

const exercises = [
  'Bankdrücken', 'Kniebeuge', 'Kreuzheben', 'Schulterdrücken',
  'Klimmzüge', 'Rudern', 'Bizeps-Curl', 'Trizeps-Dips',
];

const percentages = [50, 60, 70, 75, 80, 85, 90, 95];

function calcOneRm(weight: number, reps: number): OneRmResult | null {
  if (weight <= 0 || reps < 1 || reps > 30) return null;
  // Brzycki: 1RM = weight / (1.0278 - 0.0278 × reps)
  const brzycki = reps === 1 ? weight : Math.round(weight / (1.0278 - 0.0278 * reps));
  // Epley: 1RM = weight × (1 + reps / 30)
  const epley = Math.round(weight * (1 + reps / 30));
  return {
    brzycki,
    epley,
    percentages: percentages.map((pct) => ({
      pct,
      weight: Math.round(brzycki * pct / 100 * 2) / 2, // auf 0.5 kg gerundet
    })),
  };
}

export default function OneRmCalculator() {
  const [exercise, setExercise] = useState(exercises[0]);
  const [liftWeight, setLiftWeight] = useState('');
  const [reps, setReps] = useState('');
  const [error, setError] = useState('');

  const weightNum = parseFloat(liftWeight);
  const repsNum = parseInt(reps);

  let result: OneRmResult | null = null;
  let calcError = '';

  if (weightNum > 0 && repsNum > 0) {
    if (repsNum > 30) {
      calcError = 'Wiederholungen sollten maximal 30 betragen für eine genaue Schätzung.';
    } else {
      result = calcOneRm(weightNum, repsNum);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">1RM – Einwiederholungsmaximum</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Schätze dein maximales Trainingsgewicht. Formel: Brzycki & Epley
          </p>
        </div>
      </div>

      {/* Eingaben */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Übung */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Übung</label>
          <div className="relative">
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className={`${inputClass} appearance-none pr-10 cursor-pointer`}
            >
              {exercises.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Gewicht */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Gehobenes Gewicht (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="1" max="500" step="0.5"
            placeholder="z.B. 80"
            value={liftWeight}
            onChange={(e) => setLiftWeight(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Wiederholungen */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Wiederholungen <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="1" max="30"
            placeholder="z.B. 5"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">1–30 Wdh.</span>
        </div>
      </div>

      {/* Fehler */}
      {calcError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {calcError}
        </div>
      )}

      {/* Ergebnis */}
      {result && (
        <div className="animate-scale-in space-y-4">
          {/* 1RM Ergebnis */}
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-6 text-white shadow-lg shadow-red-500/25">
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">{exercise}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-4xl font-extrabold">{result.brzycki}</span>
                <span className="block text-xs opacity-80 mt-1">kg (Brzycki)</span>
              </div>
              <div className="text-center border-l border-white/30 pl-4">
                <span className="text-4xl font-extrabold">{result.epley}</span>
                <span className="block text-xs opacity-80 mt-1">kg (Epley)</span>
              </div>
            </div>
            <p className="text-xs opacity-70 text-center mt-3">
              Geschätztes 1-Wiederholungsmaximum
            </p>
          </div>

          {/* Trainingsgewichte nach Prozent */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Trainingsgewichte (Brzycki-Basis: {result.brzycki} kg)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {result.percentages.map(({ pct, weight }) => {
                const color =
                  pct <= 60 ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' :
                  pct <= 75 ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400' :
                  pct <= 85 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' :
                              'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
                return (
                  <div key={pct} className={`border rounded-xl p-3 text-center ${color}`}>
                    <span className="text-xs font-semibold uppercase tracking-wide block">{pct}%</span>
                    <span className="text-xl font-bold block mt-1">{weight} kg</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trainingshinweis */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Trainingsempfehlungen:</p>
            <div className="grid grid-cols-2 gap-1">
              <span>50–60%: Aufwärmen / Technik</span>
              <span>60–70%: Hypertrophie</span>
              <span>70–80%: Kraftausdauer</span>
              <span>80–90%: Maximalkraft</span>
              <span>90–100%: Wettkampfvorbereitung</span>
            </div>
          </div>
        </div>
      )}

      {!weightNum && !repsNum && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Gewicht und Wiederholungen eingeben, um das 1RM zu schätzen.
        </div>
      )}
    </div>
  );
}
