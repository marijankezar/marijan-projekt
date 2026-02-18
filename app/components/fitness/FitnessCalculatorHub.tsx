'use client';

import { useState } from 'react';
import {
  Scale, Percent, Ruler, Flame, Dumbbell,
  Heart, Wind, Activity, User, Timer,
  Utensils, Droplets, Target, Gauge,
} from 'lucide-react';
import type { Gender, UnitSystem } from '@/types/fitness';
import BmiCalculator from './BmiCalculator';
import BodyFatCalculator from './BodyFatCalculator';
import WhrCalculator from './WhrCalculator';
import TdeeCalculator from './TdeeCalculator';
import OneRmCalculator from './OneRmCalculator';
import RestingHeartRate from './RestingHeartRate';
import Vo2maxCalculator from './Vo2maxCalculator';
import HrvInfo from './HrvInfo';
import RunningPace from './RunningPace';
import BloodPressure from './BloodPressure';
import CaloriesBurned from './CaloriesBurned';
import Macronutrients from './Macronutrients';
import WaterIntake from './WaterIntake';
import IdealWeight from './IdealWeight';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

interface Tab {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

const tabs: Tab[] = [
  // ── Original 8 Module ────────────────────────────────────────────────────
  { id: 'bmi',      label: 'BMI',             shortLabel: 'BMI',    icon: Scale,    color: 'text-teal-600 dark:text-teal-400',    gradient: 'from-teal-400 to-teal-600'        },
  { id: 'bodyfat',  label: 'Körperfett',       shortLabel: 'Fett',   icon: Percent,  color: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-violet-600'   },
  { id: 'whr',      label: 'WHR',              shortLabel: 'WHR',    icon: Ruler,    color: 'text-amber-600 dark:text-amber-400',  gradient: 'from-amber-400 to-orange-500'     },
  { id: 'tdee',     label: 'TDEE',             shortLabel: 'TDEE',   icon: Flame,    color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-400 to-orange-600'  },
  { id: 'onerm',    label: '1RM',              shortLabel: '1RM',    icon: Dumbbell, color: 'text-red-600 dark:text-red-400',      gradient: 'from-red-500 to-rose-600'         },
  { id: 'rhr',      label: 'Ruhepuls',         shortLabel: 'Puls',   icon: Heart,    color: 'text-pink-600 dark:text-pink-400',    gradient: 'from-pink-500 to-rose-500'        },
  { id: 'vo2max',   label: 'VO₂max',           shortLabel: 'VO₂',    icon: Wind,     color: 'text-cyan-600 dark:text-cyan-400',    gradient: 'from-cyan-500 to-blue-600'        },
  { id: 'hrv',      label: 'HRV-Info',         shortLabel: 'HRV',    icon: Activity, color: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-500 to-purple-600' },
  // ── Klassische 6 Module ───────────────────────────────────────────────────
  { id: 'pace',     label: 'Lauftempo',        shortLabel: 'Pace',   icon: Timer,    color: 'text-sky-600 dark:text-sky-400',      gradient: 'from-sky-400 to-cyan-500'         },
  { id: 'bp',       label: 'Blutdruck',        shortLabel: 'BD',     icon: Gauge,    color: 'text-rose-600 dark:text-rose-400',    gradient: 'from-rose-500 to-red-600'         },
  { id: 'calories', label: 'Kalorien',         shortLabel: 'kcal',   icon: Flame,    color: 'text-yellow-600 dark:text-yellow-400', gradient: 'from-yellow-400 to-orange-500' },
  { id: 'macros',   label: 'Makros',           shortLabel: 'Makro',  icon: Utensils, color: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-green-600'},
  { id: 'water',    label: 'Wasser',           shortLabel: 'H₂O',    icon: Droplets, color: 'text-blue-600 dark:text-blue-400',    gradient: 'from-blue-400 to-cyan-500'        },
  { id: 'ideal',    label: 'Idealgewicht',     shortLabel: 'Ideal',  icon: Target,   color: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-500 to-purple-600' },
];

export default function FitnessCalculatorHub() {
  const [activeTab, setActiveTab] = useState('bmi');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  // Geteilte persönliche Daten
  const [gender, setGender] = useState<Gender>('male');
  const [ageInput, setAgeInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');

  const ageNum = ageInput ? parseInt(ageInput) : null;
  const weightNum = weightInput ? parseFloat(weightInput) : null;
  const heightNum = heightInput ? parseFloat(heightInput) : null;

  // Einheitenumrechnung
  const weightKg = unitSystem === 'imperial' && weightNum ? Math.round(weightNum * 0.453592 * 10) / 10 : weightNum;
  const heightCm = unitSystem === 'imperial' && heightNum ? Math.round(heightNum * 30.48 * 10) / 10 : heightNum;

  function renderCalculator() {
    const props = { gender, age: ageNum, weight: weightKg, height: heightCm };
    switch (activeTab) {
      case 'bmi':      return <BmiCalculator {...props} unitSystem={unitSystem} />;
      case 'bodyfat':  return <BodyFatCalculator gender={gender} height={heightCm} />;
      case 'whr':      return <WhrCalculator gender={gender} />;
      case 'tdee':     return <TdeeCalculator {...props} />;
      case 'onerm':    return <OneRmCalculator />;
      case 'rhr':      return <RestingHeartRate age={ageNum} gender={gender} />;
      case 'vo2max':   return <Vo2maxCalculator age={ageNum} gender={gender} />;
      case 'hrv':      return <HrvInfo age={ageNum} gender={gender} />;
      case 'pace':     return <RunningPace />;
      case 'bp':       return <BloodPressure age={ageNum} gender={gender} />;
      case 'calories': return <CaloriesBurned weight={weightKg} />;
      case 'macros':   return <Macronutrients {...props} />;
      case 'water':    return <WaterIntake weight={weightKg} />;
      case 'ideal':    return <IdealWeight gender={gender} height={heightCm} weight={weightKg} />;
      default:         return null;
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn   { from { opacity: 0; transform: scale(0.92); }     to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-up  { animation: fadeInUp 0.45s ease-out forwards; }
        .animate-scale-in    { animation: scaleIn 0.35s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-6">

          {/* ── Seitenkopf ── */}
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 mb-4">
              <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
              Fitness Rechner
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              14 Berechnungsmodule – alles an einem Ort
            </p>
          </div>

          {/* ── Einheitenumschalter ── */}
          <div className="flex justify-end">
            <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm gap-1">
              {(['metric', 'imperial'] as UnitSystem[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnitSystem(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    unitSystem === u
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {u === 'metric' ? '⚖ Metrisch' : '📐 Imperial'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Persönliche Daten ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-7 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-green-500/25">
                <User className="w-4 h-4 text-white" />
              </div>
              Persönliche Daten
              <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
                (werden an alle Rechner weitergegeben)
              </span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Geschlecht</label>
                <div className="flex gap-1.5">
                  {(['male', 'female'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        gender === g
                          ? g === 'male'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                            : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md shadow-pink-500/30 scale-[1.02]'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {g === 'male' ? '♂' : '♀'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Alter (Jahre)</label>
                <input type="number" min="1" max="120" placeholder="z.B. 30"
                  value={ageInput} onChange={(e) => setAgeInput(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Gewicht ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input type="number" min="1" max={unitSystem === 'metric' ? 500 : 1100} step="0.1"
                  placeholder={unitSystem === 'metric' ? 'z.B. 75' : 'z.B. 165'}
                  value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Größe ({unitSystem === 'metric' ? 'cm' : 'ft (Dez.)'})
                </label>
                <input type="number" min="1" max={unitSystem === 'metric' ? 300 : 9} step={unitSystem === 'metric' ? 0.5 : 0.01}
                  placeholder={unitSystem === 'metric' ? 'z.B. 180' : 'z.B. 5.11'}
                  value={heightInput} onChange={(e) => setHeightInput(e.target.value)} className={inputClass} />
              </div>
            </div>

            {unitSystem === 'imperial' && (weightNum || heightNum) && (
              <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                Umgerechnet: {weightKg ? `${weightKg} kg` : '—'} / {heightCm ? `${heightCm} cm` : '—'}
              </div>
            )}
          </div>

          {/* ── Tab-Navigation ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Tabs scrollbar auf Mobile */}
            <div className="overflow-x-auto">
              <div className="flex min-w-max border-b border-gray-100 dark:border-gray-700">
                {tabs.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  // Trennlinie zwischen den beiden Gruppen
                  const showDivider = idx === 8;
                  return (
                    <span key={tab.id} className="contents">
                      {showDivider && (
                        <div className="w-px bg-gray-200 dark:bg-gray-600 self-stretch my-1" />
                      )}
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                          isActive
                            ? `${tab.color} border-b-2 border-current bg-gray-50 dark:bg-gray-700/50`
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          isActive ? `bg-gradient-to-br ${tab.gradient} shadow-sm` : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                        </div>
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.shortLabel}</span>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Aktiver Rechner */}
            <div className="p-5 sm:p-7 animate-fade-in-up" key={activeTab}>
              {renderCalculator()}
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <div className="text-xs text-center text-gray-400 dark:text-gray-500 px-4 pb-4">
            Alle Werte sind Näherungswerte und dienen nur der Information. Sie ersetzen keine ärztliche Beratung.
            Bitte konsultiere einen Arzt für persönliche Gesundheitsbewertungen.
          </div>

        </div>
      </div>
    </>
  );
}
