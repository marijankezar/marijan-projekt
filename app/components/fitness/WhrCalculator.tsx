'use client';

import { useState } from 'react';
import { Ruler } from 'lucide-react';
import type { PersonalData, WhrResult } from '@/types/fitness';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:ring-amber-400/20 dark:focus:border-amber-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

interface WhrProps extends Pick<PersonalData, 'gender'> {}

function getWhrResult(ratio: number, gender: 'male' | 'female'): WhrResult {
  const isMale = gender === 'male';
  // WHO-Grenzwerte: Männer > 0.9, Frauen > 0.85
  if (isMale) {
    if (ratio <= 0.85) return { ratio, risk: 'low', label: 'Geringes Risiko', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' };
    if (ratio <= 0.90) return { ratio, risk: 'moderate', label: 'Moderates Risiko', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
    return               { ratio, risk: 'high', label: 'Erhöhtes Risiko', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' };
  } else {
    if (ratio <= 0.75) return { ratio, risk: 'low', label: 'Geringes Risiko', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' };
    if (ratio <= 0.85) return { ratio, risk: 'moderate', label: 'Moderates Risiko', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
    return               { ratio, risk: 'high', label: 'Erhöhtes Risiko', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' };
  }
}

export default function WhrCalculator({ gender }: WhrProps) {
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');

  const waistNum = parseFloat(waist);
  const hipNum = parseFloat(hip);

  let result: WhrResult | null = null;
  let error = '';

  if (waistNum > 0 && hipNum > 0) {
    if (hipNum <= 0) {
      error = 'Hüftumfang muss größer als 0 sein.';
    } else if (waistNum >= hipNum * 1.5) {
      error = 'Taillenmaß scheint zu groß – bitte Eingaben prüfen.';
    } else {
      const ratio = waistNum / hipNum;
      result = getWhrResult(ratio, gender);
    }
  }

  // Visualisierung: Marker auf einer Skala 0.5–1.2
  const markerPos = result ? Math.min(Math.max(((result.ratio - 0.5) / (1.2 - 0.5)) * 100, 0), 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
          <Ruler className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Taille-zu-Hüfte-Verhältnis (WHR)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Formel: Taillenumfang ÷ Hüftumfang. Indikator für Bauchfett und metabolisches Risiko.
          </p>
        </div>
      </div>

      {/* Messanleitung */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <p className="font-semibold mb-1">Messtipps:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
          <li>Taille: Schmalste Stelle zwischen Rippen und Hüftknochen messen</li>
          <li>Hüfte: Breiteste Stelle der Hüfte/des Gesäßes messen</li>
          <li>Aufrecht stehen, Maßband waagrecht halten, normal ausatmen</li>
        </ul>
      </div>

      {/* Eingaben */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Taillenumfang (cm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="40" max="200" step="0.5"
            placeholder="z.B. 80"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Hüftumfang (cm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="50" max="200" step="0.5"
            placeholder="z.B. 100"
            value={hip}
            onChange={(e) => setHip(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Fehler */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Ergebnis */}
      {result && (
        <div className="animate-scale-in space-y-4">
          <div className={`${result.bg} rounded-xl p-6 text-center`}>
            <span className={`text-5xl font-extrabold ${result.color}`}>{result.ratio.toFixed(2)}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">WHR</span>
            <span className={`block mt-2 text-lg font-semibold ${result.color}`}>{result.label}</span>
          </div>

          {/* Skala */}
          <div>
            <div className="relative h-4 rounded-full overflow-hidden flex">
              <div className="flex-[35] bg-green-400" title="Geringes Risiko" />
              <div className="flex-[15] bg-yellow-400" title="Moderates Risiko" />
              <div className="flex-[50] bg-red-400" title="Erhöhtes Risiko" />
            </div>
            <div className="relative h-4">
              <div
                className="absolute w-3 h-3 bg-gray-900 dark:bg-white rounded-full top-0.5 -translate-x-1/2 shadow ring-2 ring-white dark:ring-gray-900"
                style={{ left: `${markerPos}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span>0.50</span>
              <span>{gender === 'male' ? '0.85' : '0.75'}</span>
              <span>{gender === 'male' ? '0.90' : '0.85'}</span>
              <span>1.20</span>
            </div>
          </div>

          {/* Referenztabelle */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              WHO-Referenzwerte ({gender === 'male' ? 'Männer' : 'Frauen'})
            </p>
            <div className="space-y-2 text-sm">
              {gender === 'male' ? (
                <>
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 rounded-lg px-4 py-2">
                    <span className="text-green-700 dark:text-green-400 font-semibold">≤ 0.85</span>
                    <span className="text-gray-600 dark:text-gray-400">Geringes kardiovaskuläres Risiko</span>
                  </div>
                  <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/30 rounded-lg px-4 py-2">
                    <span className="text-yellow-700 dark:text-yellow-400 font-semibold">0.86 – 0.90</span>
                    <span className="text-gray-600 dark:text-gray-400">Moderates Risiko</span>
                  </div>
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 rounded-lg px-4 py-2">
                    <span className="text-red-700 dark:text-red-400 font-semibold">&gt; 0.90</span>
                    <span className="text-gray-600 dark:text-gray-400">Erhöhtes Risiko (Bauchfettleibigkeit)</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 rounded-lg px-4 py-2">
                    <span className="text-green-700 dark:text-green-400 font-semibold">≤ 0.75</span>
                    <span className="text-gray-600 dark:text-gray-400">Geringes kardiovaskuläres Risiko</span>
                  </div>
                  <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/30 rounded-lg px-4 py-2">
                    <span className="text-yellow-700 dark:text-yellow-400 font-semibold">0.76 – 0.85</span>
                    <span className="text-gray-600 dark:text-gray-400">Moderates Risiko</span>
                  </div>
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 rounded-lg px-4 py-2">
                    <span className="text-red-700 dark:text-red-400 font-semibold">&gt; 0.85</span>
                    <span className="text-gray-600 dark:text-gray-400">Erhöhtes Risiko (Bauchfettleibigkeit)</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!waistNum && !hipNum && (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Taillen- und Hüftumfang eingeben, um das WHR zu berechnen.
        </div>
      )}
    </div>
  );
}
