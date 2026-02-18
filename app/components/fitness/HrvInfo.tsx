'use client';

import { Activity } from 'lucide-react';
import type { PersonalData } from '@/types/fitness';

interface HrvProps extends Pick<PersonalData, 'age' | 'gender'> {}

const hrvData = [
  { age: '20–29', maleRange: '55–105 ms', femaleRange: '55–105 ms', note: 'Höchste HRV-Werte – gute Regenerationskapazität' },
  { age: '30–39', maleRange: '45–95 ms', femaleRange: '50–100 ms', note: 'Leichter Rückgang, individuelle Variation hoch' },
  { age: '40–49', maleRange: '35–80 ms', femaleRange: '40–85 ms', note: 'Moderater Rückgang – Lebensstil entscheidend' },
  { age: '50–59', maleRange: '25–65 ms', femaleRange: '30–70 ms', note: 'Niedrigere Werte normal, Trends wichtiger als Absolutwert' },
  { age: '60–69', maleRange: '20–55 ms', femaleRange: '20–55 ms', note: 'HRV-Kontrolle wichtig für kardiovaskuläres Risiko' },
  { age: '70+',   maleRange: '15–45 ms', femaleRange: '15–45 ms', note: 'Basiswert oft niedrig – persönlicher Trend zählt' },
];

const influenceFactors = [
  { factor: 'Regelmäßiger Ausdauersport', effect: 'Positiv ↑', color: 'text-green-600 dark:text-green-400' },
  { factor: 'Guter Schlaf (7–9h)', effect: 'Positiv ↑', color: 'text-green-600 dark:text-green-400' },
  { factor: 'Stressmanagement / Meditation', effect: 'Positiv ↑', color: 'text-green-600 dark:text-green-400' },
  { factor: 'Ausgewogene Ernährung', effect: 'Positiv ↑', color: 'text-green-600 dark:text-green-400' },
  { factor: 'Chronischer Stress', effect: 'Negativ ↓', color: 'text-red-600 dark:text-red-400' },
  { factor: 'Alkohol & Nikotin', effect: 'Negativ ↓', color: 'text-red-600 dark:text-red-400' },
  { factor: 'Schlafmangel', effect: 'Negativ ↓', color: 'text-red-600 dark:text-red-400' },
  { factor: 'Übertraining', effect: 'Negativ ↓', color: 'text-red-600 dark:text-red-400' },
];

export default function HrvInfo({ age, gender }: HrvProps) {
  // Aktive Alterszeile ermitteln
  const currentRow = age ? hrvData.find((r) => {
    if (r.age === '70+') return age >= 70;
    const [low, high] = r.age.split('–').map(Number);
    return age >= low && age <= high;
  }) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">HRV – Herzfrequenzvariabilität</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            HRV wird gemessen (nicht berechnet) – Referenzwerte & Interpretation
          </p>
        </div>
      </div>

      {/* Was ist HRV? */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-5">
        <h4 className="font-bold text-violet-800 dark:text-violet-300 mb-2">Was ist HRV?</h4>
        <p className="text-sm text-violet-700 dark:text-violet-400 leading-relaxed">
          Die Herzfrequenzvariabilität (HRV) misst die zeitliche Variation zwischen aufeinanderfolgenden Herzschlägen.
          Eine höhere HRV deutet auf ein gut angepasstes autonomes Nervensystem hin und ist ein Zeichen von
          Regenerationsfähigkeit, Stressresistenz und allgemeiner Fitness.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
            <p className="font-semibold text-violet-800 dark:text-violet-300 mb-1">Messgröße</p>
            <p className="text-violet-700 dark:text-violet-400 text-xs">RMSSD (ms) – häufigste Metrik bei Sportuhren und Gesundheits-Apps</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
            <p className="font-semibold text-violet-800 dark:text-violet-300 mb-1">Messung</p>
            <p className="text-violet-700 dark:text-violet-400 text-xs">Morgens nach dem Aufwachen, liegend, mind. 2 Minuten – idealerweise täglich</p>
          </div>
        </div>
      </div>

      {/* Aktueller Bereich */}
      {currentRow && (
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-5 text-white shadow-lg shadow-violet-500/25">
          <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1">Deine Altersgruppe ({age} Jahre)</p>
          <p className="text-3xl font-extrabold">
            {gender === 'female' ? currentRow.femaleRange : currentRow.maleRange}
          </p>
          <p className="text-sm opacity-80 mt-1">Normaler HRV-Bereich (RMSSD)</p>
          <p className="text-xs opacity-70 mt-2">{currentRow.note}</p>
        </div>
      )}

      {!age && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          Alter in den persönlichen Daten eingeben, um deinen altersgerechten HRV-Referenzbereich anzuzeigen.
        </div>
      )}

      {/* Referenztabelle */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          HRV-Referenzwerte nach Altersgruppe (RMSSD in ms)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-2.5 text-left text-gray-600 dark:text-gray-300 rounded-tl-lg">Alter</th>
                <th className="px-4 py-2.5 text-center text-blue-600 dark:text-blue-400">Männer</th>
                <th className="px-4 py-2.5 text-center text-pink-600 dark:text-pink-400 rounded-tr-lg">Frauen</th>
              </tr>
            </thead>
            <tbody>
              {hrvData.map((row, i) => (
                <tr
                  key={row.age}
                  className={`border-t border-gray-100 dark:border-gray-700 ${
                    currentRow?.age === row.age
                      ? 'bg-violet-50 dark:bg-violet-900/20 font-semibold'
                      : i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-750'
                  }`}
                >
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">
                    {row.age} {currentRow?.age === row.age && <span className="text-violet-500 ml-1">◀ du</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center text-blue-600 dark:text-blue-400">{row.maleRange}</td>
                  <td className="px-4 py-2.5 text-center text-pink-600 dark:text-pink-400">{row.femaleRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Quellen: Shaffer & Ginsberg (2017), Nunan et al. (2010). Werte variieren je nach Gerät und Messprotokoll.
        </p>
      </div>

      {/* Interpretationshinweise */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="font-semibold text-green-700 dark:text-green-400 text-sm mb-1">Hohe HRV</p>
          <p className="text-xs text-green-600 dark:text-green-500">
            Gute Erholung, niedriger Stress, gut trainingsfähig. Intensiveres Training kann geplant werden.
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm mb-1">Normale HRV</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            Normales Erholungsniveau. Moderates Training empfohlen. Auf Schlaf und Stress achten.
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1">Niedrige HRV</p>
          <p className="text-xs text-red-600 dark:text-red-500">
            Zeichen von Stress, Übertraining oder Erschöpfung. Erholung und leichtes Training priorisieren.
          </p>
        </div>
      </div>

      {/* Einflussfaktoren */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Einflussfaktoren auf die HRV</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {influenceFactors.map((f) => (
            <div key={f.factor} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-gray-700 dark:text-gray-300">{f.factor}</span>
              <span className={`font-bold ${f.color}`}>{f.effect}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messgeräte-Hinweis */}
      <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Empfohlene Messgeräte:</p>
        <p>
          Polar H10 (Brustgurt, sehr genau) · Garmin Smartwatches · Apple Watch ·
          Oura Ring · Whoop Band. Für sportliche Anwendungen empfiehlt sich ein Brustgurt.
        </p>
      </div>
    </div>
  );
}
