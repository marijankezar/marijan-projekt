'use client';

import { Scale } from 'lucide-react';
import type { PersonalData, BmiResult, UnitSystem } from '@/types/fitness';

interface BmiCalculatorProps extends PersonalData {
  unitSystem: UnitSystem;
}

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:ring-teal-400/20 dark:focus:border-teal-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

function getBmiCategory(bmi: number): BmiResult {
  if (bmi < 18.5) return { value: bmi, category: 'Untergewicht', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' };
  if (bmi < 25)   return { value: bmi, category: 'Normalgewicht', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/40' };
  if (bmi < 30)   return { value: bmi, category: 'Übergewicht', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
  if (bmi < 35)   return { value: bmi, category: 'Adipositas I', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40' };
  if (bmi < 40)   return { value: bmi, category: 'Adipositas II', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/40' };
  return           { value: bmi, category: 'Adipositas III', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/40' };
}

export default function BmiCalculator({ weight, height, unitSystem }: BmiCalculatorProps) {
  // BMI berechnen aus den übergebenen Werten (kg, cm)
  const bmi = weight && height ? weight / ((height / 100) ** 2) : null;
  const result = bmi ? getBmiCategory(bmi) : null;
  const markerPos = bmi ? Math.min(Math.max(((bmi - 15) / (45 - 15)) * 100, 0), 100) : 0;

  const weightLabel = unitSystem === 'imperial' ? 'Gewicht (lbs)' : 'Gewicht (kg)';
  const heightLabel = unitSystem === 'imperial' ? 'Größe (ft/in)' : 'Größe (cm)';

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/25 shrink-0">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Body Mass Index (BMI)</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gewichtsklassifikation basierend auf Größe und Gewicht. Formel: kg / m²
          </p>
        </div>
      </div>

      {/* Hinweis: Eingaben kommen vom persönlichen Datenpanel oben */}
      {!weight || !height ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Gewicht und Größe oben eingeben, um den BMI zu berechnen.
        </div>
      ) : result ? (
        <div className="animate-scale-in space-y-4">
          {/* Ergebnis */}
          <div className={`${result.bg} rounded-xl p-6 text-center`}>
            <span className={`text-5xl font-extrabold ${result.color}`}>{bmi!.toFixed(1)}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">BMI</span>
            <span className={`block mt-2 text-lg font-semibold ${result.color}`}>{result.category}</span>
          </div>

          {/* Farbskala */}
          <div>
            <div className="relative h-4 rounded-full overflow-hidden flex">
              <div className="flex-[18.5] bg-blue-300" title="Untergewicht < 18.5" />
              <div className="flex-[6.4] bg-green-400" title="Normal 18.5–25" />
              <div className="flex-[5] bg-yellow-400" title="Übergewicht 25–30" />
              <div className="flex-[5] bg-orange-400" title="Adipositas I 30–35" />
              <div className="flex-[10.1] bg-red-400" title="Adipositas II–III 35+" />
            </div>
            <div className="relative h-4">
              <div
                className="absolute w-3 h-3 bg-gray-900 dark:bg-white rounded-full top-0.5 -translate-x-1/2 shadow ring-2 ring-white dark:ring-gray-900"
                style={{ left: `${markerPos}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40+</span>
            </div>
          </div>

          {/* Kategorientabelle */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { range: '< 18.5', label: 'Untergewicht', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
              { range: '18.5–24.9', label: 'Normal', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
              { range: '25–29.9', label: 'Übergewicht', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
              { range: '30–34.9', label: 'Adipositas I', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
              { range: '35–39.9', label: 'Adipositas II', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
              { range: '≥ 40', label: 'Adipositas III', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/30' },
            ].map((cat) => (
              <div key={cat.label} className={`${cat.bg} rounded-lg p-2 text-center`}>
                <span className={`font-semibold ${cat.color}`}>{cat.range}</span>
                <span className="block text-gray-600 dark:text-gray-400 mt-0.5">{cat.label}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            Hinweis: Der BMI berücksichtigt keine Muskelmasse – Athleten können trotz Normalgewicht einen erhöhten BMI haben.
          </p>
        </div>
      ) : null}

      <div className="text-xs text-gray-400 dark:text-gray-500">
        {weightLabel} / {heightLabel} werden aus den persönlichen Daten übernommen.
      </div>
    </div>
  );
}
