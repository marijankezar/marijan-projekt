'use client';

import { Target } from 'lucide-react';
import type { PersonalData } from '@/types/fitness';

interface IdealWeightProps extends Pick<PersonalData, 'gender' | 'height' | 'weight'> {}

export default function IdealWeight({ gender, height, weight }: IdealWeightProps) {
  let result: {
    devine: number;
    hamwi: number;
    broca: number;
    bmiLow: number;
    bmiHigh: number;
  } | null = null;

  if (height && height > 0) {
    const hInch = height / 2.54;
    const over60 = Math.max(hInch - 60, 0);
    result = {
      devine: Math.round((gender === 'male' ? 50 + 2.3 * over60 : 45.5 + 2.3 * over60) * 10) / 10,
      hamwi:  Math.round((gender === 'male' ? 48.0 + 2.7 * over60 : 45.4 + 2.2 * over60) * 10) / 10,
      broca:  Math.round((height - 100) * 10) / 10,
      bmiLow: Math.round(18.5 * ((height / 100) ** 2) * 10) / 10,
      bmiHigh: Math.round(24.9 * ((height / 100) ** 2) * 10) / 10,
    };
  }

  const formulas = result ? [
    { name: 'Devine', value: result.devine, desc: 'Medizinisch validiert (1974), weit verbreitet' },
    { name: 'Hamwi', value: result.hamwi, desc: 'Verwendet in klinischer Diätetik' },
    { name: 'Broca', value: result.broca, desc: 'Einfache Faustformel (Größe − 100)' },
  ] : [];

  // Aktuelles Gewicht einordnen
  const currentBmi = weight && height ? weight / ((height / 100) ** 2) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Idealgewicht</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nach Devine-, Hamwi- & Broca-Formel plus gesunder BMI-Bereich (18.5–24.9)
          </p>
        </div>
      </div>

      {!height ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Größe in den persönlichen Daten oben eingeben.
        </div>
      ) : result ? (
        <div className="animate-scale-in space-y-4">
          {/* BMI-Range Hauptergebnis */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/25">
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-2">
              Gesunder BMI-Bereich (18.5–24.9) bei {height} cm
            </p>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <span className="text-3xl font-extrabold">{result.bmiLow} kg</span>
                <span className="block text-xs opacity-70 mt-0.5">Untergrenze (BMI 18.5)</span>
              </div>
              <span className="text-2xl font-bold opacity-60">–</span>
              <div className="text-center">
                <span className="text-3xl font-extrabold">{result.bmiHigh} kg</span>
                <span className="block text-xs opacity-70 mt-0.5">Obergrenze (BMI 24.9)</span>
              </div>
            </div>
          </div>

          {/* Aktuelle Einordnung */}
          {weight && currentBmi && (
            <div className={`rounded-xl p-4 border ${
              currentBmi < 18.5 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' :
              currentBmi < 25   ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' :
              currentBmi < 30   ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' :
                                  'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Dein aktuelles Gewicht</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{weight} kg</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500 dark:text-gray-400">Differenz zum Idealbereich</span>
                <span className={`font-semibold ${
                  weight < result.bmiLow ? 'text-blue-600 dark:text-blue-400' :
                  weight <= result.bmiHigh ? 'text-green-600 dark:text-green-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {weight < result.bmiLow
                    ? `${(result.bmiLow - weight).toFixed(1)} kg zu wenig`
                    : weight > result.bmiHigh
                    ? `${(weight - result.bmiHigh).toFixed(1)} kg zu viel`
                    : '✓ Im gesunden Bereich'}
                </span>
              </div>
            </div>
          )}

          {/* Formel-Vergleich */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Idealgewicht nach verschiedenen Formeln ({gender === 'male' ? 'Männer' : 'Frauen'})
            </p>
            <div className="space-y-2">
              {formulas.map((f) => (
                <div key={f.name} className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{f.name}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</span>
                  </div>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{f.value} kg</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
            Formeln berücksichtigen keine Muskelmasse, Körperbau oder individuelle Gesundheitsfaktoren. Der BMI-Bereich (18.5–24.9) gilt als zuverlässigster allgemeiner Richtwert.
          </div>
        </div>
      ) : null}
    </div>
  );
}
