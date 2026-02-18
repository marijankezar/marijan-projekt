'use client';

import { useState } from 'react';
import { Flame, ChevronDown } from 'lucide-react';
import type { PersonalData } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 dark:focus:ring-yellow-400/20 dark:focus:border-yellow-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

const activities = [
  { label: 'Gehen (normal)',        met: 3.5 },
  { label: 'Schnelles Gehen',       met: 5.0 },
  { label: 'Laufen (8 km/h)',        met: 8.0 },
  { label: 'Laufen (10 km/h)',       met: 10.0 },
  { label: 'Laufen (12 km/h)',       met: 12.5 },
  { label: 'Radfahren (gemütlich)',  met: 4.0 },
  { label: 'Radfahren (moderat)',    met: 8.0 },
  { label: 'Schwimmen (moderat)',    met: 6.0 },
  { label: 'Schwimmen (intensiv)',   met: 10.0 },
  { label: 'Yoga',                   met: 3.0 },
  { label: 'Krafttraining',          met: 6.0 },
  { label: 'HIIT',                   met: 12.0 },
  { label: 'Tanzen',                 met: 5.5 },
  { label: 'Wandern',                met: 6.5 },
  { label: 'Seilspringen',           met: 12.0 },
  { label: 'Rudern',                 met: 7.0 },
];

interface CaloriesProps extends Pick<PersonalData, 'weight'> {}

export default function CaloriesBurned({ weight }: CaloriesProps) {
  const [activityIdx, setActivityIdx] = useState(-1);
  const [duration, setDuration] = useState('');

  const durationNum = parseFloat(duration);
  const selectedActivity = activityIdx >= 0 ? activities[activityIdx] : null;

  let calories: number | null = null;
  if (selectedActivity && durationNum > 0 && weight && weight > 0) {
    // Formel: MET × Gewicht (kg) × Dauer (h)
    calories = Math.round(selectedActivity.met * weight * (durationNum / 60));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md shadow-yellow-500/25 shrink-0">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kalorienverbrauch</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Geschätzter Kalorienverbrauch bei Sport – basierend auf MET-Werten
          </p>
        </div>
      </div>

      {!weight && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-300">
          Gewicht in den persönlichen Daten oben eingeben für genaue Berechnung.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Aktivität */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Aktivität <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={activityIdx}
              onChange={(e) => setActivityIdx(parseInt(e.target.value))}
              className={`${inputClass} appearance-none pr-10 cursor-pointer`}
            >
              <option value={-1}>-- Aktivität wählen --</option>
              {activities.map((a, i) => (
                <option key={i} value={i}>{a.label} (MET {a.met})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Dauer */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Dauer (Minuten) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="1" max="600"
            placeholder="z.B. 45"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          />
          {/* Schnellauswahl */}
          <div className="flex gap-1.5 mt-2">
            {[15, 30, 45, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(String(d))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
              >
                {d} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ergebnis */}
      {calories !== null ? (
        <div className="animate-scale-in space-y-4">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white text-center shadow-lg shadow-yellow-500/25">
            <span className="text-5xl font-extrabold">{calories}</span>
            <span className="block text-sm opacity-80 mt-1 uppercase tracking-wider">kcal verbrannt</span>
            <span className="block text-xs opacity-70 mt-2">
              {selectedActivity!.label} · {durationNum} min · {weight} kg
            </span>
          </div>

          {/* Vergleiche */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Entspricht ungefähr…</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
              {[
                { label: 'Äpfel', kcal: 52, emoji: '🍎' },
                { label: 'Bananen', kcal: 89, emoji: '🍌' },
                { label: 'Bier (0.5L)', kcal: 215, emoji: '🍺' },
                { label: 'Schokoriegel', kcal: 230, emoji: '🍫' },
              ].map((food) => (
                <div key={food.label} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                  <span className="text-2xl">{food.emoji}</span>
                  <span className="block font-bold text-gray-800 dark:text-gray-200 mt-1">
                    {(calories! / food.kcal).toFixed(1)}×
                  </span>
                  <span className="block text-gray-500 dark:text-gray-400">{food.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
            Berechnung: MET ({selectedActivity!.met}) × Gewicht ({weight} kg) × Zeit ({(durationNum/60).toFixed(2)} h)
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Aktivität und Dauer auswählen, um den Kalorienverbrauch zu berechnen.
        </div>
      )}
    </div>
  );
}
