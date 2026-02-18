'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import type { PersonalData, RestingHrResult } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 dark:focus:ring-pink-400/20 dark:focus:border-pink-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

interface RestingHrProps extends Pick<PersonalData, 'age' | 'gender'> {}

interface ZoneInfo {
  name: string;
  pct: [number, number]; // % des HRR
  color: string;
  bg: string;
}

const zones: ZoneInfo[] = [
  { name: 'Erholung', pct: [50, 60], color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  { name: 'Fettverbrennung', pct: [60, 70], color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
  { name: 'Aerob', pct: [70, 80], color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  { name: 'Anaerob', pct: [80, 90], color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  { name: 'Maximum', pct: [90, 100], color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
];

function getHrCategory(bpm: number, age: number | null): RestingHrResult {
  // Altersabhängige Anpassung
  const isOlderAdult = age !== null && age >= 60;

  if (bpm < 50) return {
    bpm, category: 'athlete',
    label: 'Athleten-Bereich',
    description: 'Exzellente kardiovaskuläre Fitness – typisch für trainierte Ausdauersportler.',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
  };
  if (bpm <= 60) return {
    bpm, category: 'good',
    label: 'Sehr gut',
    description: 'Überdurchschnittliche Fitness. Das Herz arbeitet in Ruhe effizient.',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/40',
  };
  if (bpm <= 80) return {
    bpm, category: 'normal',
    label: 'Normal',
    description: isOlderAdult
      ? 'Guter Normbereich für Erwachsene 60+. Regelmäßige Ausdauerübungen sind empfehlenswert.'
      : 'Normaler Ruhepuls für einen gesunden Erwachsenen.',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
  };
  if (bpm <= 90) return {
    bpm, category: 'elevated',
    label: 'Leicht erhöht',
    description: 'Leicht über dem Normbereich. Regelmäßiger Ausdauersport kann die Herzgesundheit verbessern.',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/40',
  };
  return {
    bpm, category: 'high',
    label: 'Erhöht',
    description: 'Über dem Normbereich. Bei dauerhaft erhöhtem Puls einen Arzt konsultieren.',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
  };
}

export default function RestingHeartRate({ age, gender }: RestingHrProps) {
  const [bpmInput, setBpmInput] = useState('');

  const bpmNum = parseInt(bpmInput);
  const maxHR = age ? Math.round(220 - age) : null;

  let result: RestingHrResult | null = null;
  let calcError = '';

  if (bpmNum > 0) {
    if (bpmNum < 20 || bpmNum > 220) {
      calcError = 'Bitte einen realistischen Ruhepuls (20–220 bpm) eingeben.';
    } else {
      result = getHrCategory(bpmNum, age);
    }
  }

  // Karvonen Trainingszonen berechnen
  const karvonenZones = result && maxHR ? zones.map((z) => {
    const hrr = maxHR - result!.bpm;
    return {
      ...z,
      low: Math.round(result!.bpm + hrr * (z.pct[0] / 100)),
      high: Math.round(result!.bpm + hrr * (z.pct[1] / 100)),
    };
  }) : null;

  // Marker-Position auf Skala (20–200 bpm)
  const markerPos = bpmNum ? Math.min(Math.max(((bpmNum - 20) / (200 - 20)) * 100, 0), 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/25 shrink-0">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ruhepuls-Bewertung</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Eingabe des gemessenen Ruhepulses + Karvonen-Trainingszonen
          </p>
        </div>
      </div>

      {/* Messtipps */}
      <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-4 text-sm text-pink-800 dark:text-pink-300">
        <p className="font-semibold mb-1">Ruhepuls richtig messen:</p>
        <p className="text-pink-700 dark:text-pink-400 text-xs">
          Morgens direkt nach dem Aufwachen messen, noch liegend, 60 Sekunden lang zählen oder 15 Sekunden × 4.
        </p>
      </div>

      {/* Eingabe */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Ruhepuls (bpm) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number" min="20" max="220"
            placeholder="z.B. 65"
            value={bpmInput}
            onChange={(e) => setBpmInput(e.target.value)}
            className={inputClass}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">bpm</span>
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
          {/* Kategorie */}
          <div className={`${result.bg} rounded-xl p-6 text-center`}>
            <span className={`text-5xl font-extrabold ${result.color}`}>{result.bpm}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">bpm</span>
            <span className={`block mt-2 text-lg font-semibold ${result.color}`}>{result.label}</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm mx-auto">{result.description}</p>
          </div>

          {/* Skala */}
          <div>
            <div className="relative h-4 rounded-full overflow-hidden flex">
              <div className="flex-[30] bg-blue-400" title="Athlet < 50" />
              <div className="flex-[10] bg-green-400" title="Gut 50–60" />
              <div className="flex-[20] bg-yellow-400" title="Normal 61–80" />
              <div className="flex-[10] bg-orange-400" title="Erhöht 81–90" />
              <div className="flex-[30] bg-red-400" title="Hoch > 90" />
            </div>
            <div className="relative h-4">
              <div
                className="absolute w-3 h-3 bg-gray-900 dark:bg-white rounded-full top-0.5 -translate-x-1/2 shadow ring-2 ring-white dark:ring-gray-900"
                style={{ left: `${markerPos}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span>20</span><span>50</span><span>60</span><span>80</span><span>90</span><span>200+</span>
            </div>
          </div>

          {/* Maximalpuls Info */}
          {maxHR && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-center">
                <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Maximalpuls</span>
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">{maxHR}</span>
                <span className="block text-xs text-gray-400">220 − Alter ({age})</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-center">
                <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">HRR (Herzfrequenz-Reserve)</span>
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">{maxHR - result.bpm}</span>
                <span className="block text-xs text-gray-400">Max − Ruhepuls</span>
              </div>
            </div>
          )}

          {/* Karvonen Trainingszonen */}
          {karvonenZones && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Trainingszonen nach Karvonen (Alter: {age})
              </p>
              <div className="space-y-2">
                {karvonenZones.map((z) => (
                  <div key={z.name} className={`flex items-center justify-between ${z.bg} rounded-lg px-4 py-2.5`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${z.color}`}>{z.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({z.pct[0]}–{z.pct[1]}%)</span>
                    </div>
                    <span className={`text-sm font-bold ${z.color}`}>{z.low}–{z.high} bpm</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!age && (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              Alter in den persönlichen Daten eingeben, um Maximalpuls und Karvonen-Zonen zu berechnen.
            </div>
          )}
        </div>
      )}

      {!bpmNum && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Gemessenen Ruhepuls eingeben, um die Bewertung zu sehen.
        </div>
      )}
    </div>
  );
}
