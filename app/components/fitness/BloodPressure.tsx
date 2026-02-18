'use client';

import { Heart } from 'lucide-react';
import type { PersonalData } from '@/types/fitness';

interface BloodPressureProps extends Pick<PersonalData, 'age' | 'gender'> {}

interface BPRef { period: string; systolic: string; diastolic: string; }

function getRefs(age: number | null, gender: 'male' | 'female'): BPRef[] | null {
  if (!age || age <= 0) return null;
  if (age < 18) return [
    { period: 'Morgens', systolic: '100–110', diastolic: '60–70' },
    { period: 'Tagsüber', systolic: '105–115', diastolic: '65–75' },
    { period: 'Abends', systolic: '100–110', diastolic: '60–70' },
  ];
  if (age <= 39) return gender === 'male' ? [
    { period: 'Morgens', systolic: '110–120', diastolic: '70–80' },
    { period: 'Tagsüber', systolic: '115–130', diastolic: '75–85' },
    { period: 'Abends', systolic: '110–120', diastolic: '70–80' },
  ] : [
    { period: 'Morgens', systolic: '105–115', diastolic: '65–75' },
    { period: 'Tagsüber', systolic: '110–125', diastolic: '70–80' },
    { period: 'Abends', systolic: '105–115', diastolic: '65–75' },
  ];
  if (age <= 59) return gender === 'male' ? [
    { period: 'Morgens', systolic: '115–130', diastolic: '75–85' },
    { period: 'Tagsüber', systolic: '120–135', diastolic: '80–90' },
    { period: 'Abends', systolic: '115–125', diastolic: '75–85' },
  ] : [
    { period: 'Morgens', systolic: '110–125', diastolic: '70–80' },
    { period: 'Tagsüber', systolic: '115–130', diastolic: '75–85' },
    { period: 'Abends', systolic: '110–120', diastolic: '70–80' },
  ];
  return gender === 'male' ? [
    { period: 'Morgens', systolic: '120–135', diastolic: '75–85' },
    { period: 'Tagsüber', systolic: '125–140', diastolic: '80–90' },
    { period: 'Abends', systolic: '120–130', diastolic: '75–85' },
  ] : [
    { period: 'Morgens', systolic: '115–130', diastolic: '70–80' },
    { period: 'Tagsüber', systolic: '120–135', diastolic: '75–85' },
    { period: 'Abends', systolic: '115–125', diastolic: '70–80' },
  ];
}

const bpCategories = [
  { label: 'Optimal',          sys: '< 120',    dia: '< 80',    color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/30' },
  { label: 'Normal',           sys: '120–129',  dia: '80–84',   color: 'text-teal-600 dark:text-teal-400',   bg: 'bg-teal-50 dark:bg-teal-900/30' },
  { label: 'Hoch-Normal',      sys: '130–139',  dia: '85–89',   color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  { label: 'Grad 1 (leicht)',  sys: '140–159',  dia: '90–99',   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  { label: 'Grad 2 (mittel)',  sys: '160–179',  dia: '100–109', color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/30' },
  { label: 'Grad 3 (schwer)',  sys: '≥ 180',    dia: '≥ 110',   color: 'text-red-800 dark:text-red-300',     bg: 'bg-red-100 dark:bg-red-900/50' },
];

export default function BloodPressure({ age, gender }: BloodPressureProps) {
  const refs = getRefs(age, gender);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Blutdruck-Referenzwerte</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Typische Werte nach Alter, Geschlecht & Tageszeit (mmHg) – keine medizinische Diagnose
          </p>
        </div>
      </div>

      {!age ? (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Alter in den persönlichen Daten oben eingeben, um Referenzwerte zu sehen.
        </div>
      ) : refs ? (
        <div className="animate-scale-in space-y-4">
          {/* Tageszeit-Referenzen */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Typische Werte für {gender === 'male' ? 'Männer' : 'Frauen'}, {age} Jahre
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-4 py-2.5 text-left text-gray-600 dark:text-gray-300 rounded-tl-lg">Tageszeit</th>
                    <th className="px-4 py-2.5 text-center text-gray-600 dark:text-gray-300">Systolisch (mmHg)</th>
                    <th className="px-4 py-2.5 text-center text-gray-600 dark:text-gray-300 rounded-tr-lg">Diastolisch (mmHg)</th>
                  </tr>
                </thead>
                <tbody>
                  {refs.map((r, i) => (
                    <tr key={r.period} className={`border-t border-gray-100 dark:border-gray-700 ${i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-750'}`}>
                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{r.period}</td>
                      <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-semibold">{r.systolic}</td>
                      <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-semibold">{r.diastolic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WHO Klassifikation */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">WHO-Klassifikation (für Erwachsene)</p>
            <div className="space-y-1.5">
              {bpCategories.map((cat) => (
                <div key={cat.label} className={`flex items-center justify-between ${cat.bg} rounded-lg px-4 py-2.5`}>
                  <span className={`text-sm font-semibold ${cat.color}`}>{cat.label}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {cat.sys} / {cat.dia}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 italic bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
            Werte sind Richtwerte nach ESH/ESC-Leitlinien. Einzelmessungen können variieren – bei dauerhaft erhöhten Werten bitte einen Arzt aufsuchen.
          </div>
        </div>
      ) : null}
    </div>
  );
}
