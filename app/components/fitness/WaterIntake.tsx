'use client';

import { useState } from 'react';
import { Droplets, ChevronDown } from 'lucide-react';
import type { PersonalData } from '@/types/fitness';

const activityLevels = [
  { label: 'Sitzend', factor: 1.2, extra: 0 },
  { label: 'Leicht aktiv', factor: 1.375, extra: 0.3 },
  { label: 'Moderat aktiv', factor: 1.55, extra: 0.5 },
  { label: 'Sehr aktiv', factor: 1.725, extra: 0.8 },
  { label: 'Extrem aktiv', factor: 1.9, extra: 1.2 },
];

interface WaterProps extends Pick<PersonalData, 'weight'> {}

export default function WaterIntake({ weight }: WaterProps) {
  const [activityIdx, setActivityIdx] = useState<number>(-1);

  const baseWater = weight ? (weight * 33) / 1000 : null; // 33 ml/kg in Liter
  const selectedActivity = activityIdx >= 0 ? activityLevels[activityIdx] : null;
  const activeWater = baseWater && selectedActivity ? baseWater + selectedActivity.extra : null;

  const displayWater = activeWater ?? baseWater;

  // Gläser (250 ml)
  const glasses = displayWater ? Math.ceil(displayWater / 0.25) : null;
  const bottlesHalf = displayWater ? (displayWater / 0.5).toFixed(1) : null;
  const bottlesLarge = displayWater ? (displayWater / 1.5).toFixed(1) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Wasserbedarf</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Empfohlene tägliche Wasserzufuhr (ca. 33 ml/kg Körpergewicht)
          </p>
        </div>
      </div>

      {!weight ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Gewicht in den persönlichen Daten oben eingeben.
        </div>
      ) : (
        <>
          {/* Aktivitätslevel */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Aktivitätslevel (optional)
            </label>
            <div className="relative">
              <select
                value={activityIdx}
                onChange={(e) => setActivityIdx(parseInt(e.target.value))}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-400/20 dark:focus:border-blue-400 outline-none transition-all duration-300 appearance-none pr-10 cursor-pointer"
              >
                <option value={-1}>-- Kein Aktivitätslevel --</option>
                {activityLevels.map((a, i) => (
                  <option key={i} value={i}>{a.label} (+{a.extra.toFixed(1)}L)</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {displayWater && (
            <div className="animate-scale-in space-y-4">
              {/* Hauptergebnis */}
              <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl p-6 text-white text-center shadow-lg shadow-blue-500/25">
                <span className="text-6xl font-extrabold">{displayWater.toFixed(1)}</span>
                <span className="block text-lg font-semibold opacity-80 mt-1">Liter pro Tag</span>
                {activeWater && selectedActivity && (
                  <span className="block text-xs opacity-70 mt-1">
                    Grundbedarf {baseWater!.toFixed(1)}L + Aktivität +{selectedActivity.extra.toFixed(1)}L
                  </span>
                )}
              </div>

              {/* Umrechnungen */}
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <span className="text-2xl">🥤</span>
                  <span className="block text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{glasses}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Gläser à 250 ml</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <span className="text-2xl">🍶</span>
                  <span className="block text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{bottlesHalf}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Flaschen à 0.5L</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <span className="text-2xl">🏺</span>
                  <span className="block text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{bottlesLarge}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Flaschen à 1.5L</span>
                </div>
              </div>

              {/* Trinktipps */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Trinktipps</p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Morgens ein großes Glas Wasser auf nüchternen Magen</li>
                  <li>Vor jeder Mahlzeit ein Glas trinken</li>
                  <li>Wasserflasche immer griffbereit halten</li>
                  <li>Bei Hitze oder Sport den Bedarf erhöhen</li>
                  <li>Dunkler Urin = zu wenig getrunken</li>
                </ul>
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                Richtwert: 33 ml/kg Körpergewicht ({weight} kg). Individuelle Faktoren wie Klima, Schwitzen und Gesundheit können den Bedarf erhöhen.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
