'use client';

import { useState } from 'react';
import MyHeder from '../components/header';
import MyFooter from '../components/footer';
import { Activity, Heart, Gauge, Timer, ChevronDown } from 'lucide-react';

type Gender = 'male' | 'female';

const palFactors = [
  { value: 1.2, label: 'Sedentary (office work, little exercise)' },
  { value: 1.375, label: 'Lightly active (light exercise 1-3 days/week)' },
  { value: 1.55, label: 'Moderately active (moderate exercise 3-5 days/week)' },
  { value: 1.725, label: 'Very active (hard exercise 6-7 days/week)' },
  { value: 1.9, label: 'Extremely active (athlete, physical job)' },
];

const inputClass = "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500";

function getHeartRateCategory(bpm: number) {
  if (bpm < 50) return { label: 'Athlete', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', description: 'Excellent cardiovascular fitness, typical for trained endurance athletes.' };
  if (bpm <= 59) return { label: 'Good', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40', description: 'Above average fitness level. Your heart works efficiently at rest.' };
  if (bpm <= 80) return { label: 'Normal', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40', description: 'Within the normal range for a healthy adult at rest.' };
  if (bpm <= 90) return { label: 'Elevated', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40', description: 'Slightly elevated. Consider regular aerobic exercise to improve cardiovascular health.' };
  return { label: 'High', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', description: 'Above normal range. Consult a physician if persistently elevated.' };
}

interface BPReference {
  period: string;
  systolic: string;
  diastolic: string;
}

function getBloodPressureReferences(age: number, gender: Gender): BPReference[] {
  if (age < 18) {
    return [
      { period: 'Morning', systolic: '100-110', diastolic: '60-70' },
      { period: 'Daytime', systolic: '105-115', diastolic: '65-75' },
      { period: 'Evening', systolic: '100-110', diastolic: '60-70' },
    ];
  }
  if (age <= 39) {
    if (gender === 'male') {
      return [
        { period: 'Morning', systolic: '110-120', diastolic: '70-80' },
        { period: 'Daytime', systolic: '115-130', diastolic: '75-85' },
        { period: 'Evening', systolic: '110-120', diastolic: '70-80' },
      ];
    }
    return [
      { period: 'Morning', systolic: '105-115', diastolic: '65-75' },
      { period: 'Daytime', systolic: '110-125', diastolic: '70-80' },
      { period: 'Evening', systolic: '105-115', diastolic: '65-75' },
    ];
  }
  if (age <= 59) {
    if (gender === 'male') {
      return [
        { period: 'Morning', systolic: '115-130', diastolic: '75-85' },
        { period: 'Daytime', systolic: '120-135', diastolic: '80-90' },
        { period: 'Evening', systolic: '115-125', diastolic: '75-85' },
      ];
    }
    return [
      { period: 'Morning', systolic: '110-125', diastolic: '70-80' },
      { period: 'Daytime', systolic: '115-130', diastolic: '75-85' },
      { period: 'Evening', systolic: '110-120', diastolic: '70-80' },
    ];
  }
  // 60+
  if (gender === 'male') {
    return [
      { period: 'Morning', systolic: '120-135', diastolic: '75-85' },
      { period: 'Daytime', systolic: '125-140', diastolic: '80-90' },
      { period: 'Evening', systolic: '120-130', diastolic: '75-85' },
    ];
  }
  return [
    { period: 'Morning', systolic: '115-130', diastolic: '70-80' },
    { period: 'Daytime', systolic: '120-135', diastolic: '75-85' },
    { period: 'Evening', systolic: '115-125', diastolic: '70-80' },
  ];
}

export default function FitnessPage() {
  // Shared personal data
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // BMR calculator
  const [bmrFormula, setBmrFormula] = useState<'mifflin' | 'harris'>('mifflin');
  const [palFactor, setPalFactor] = useState(0);

  // Heart rate
  const [heartRate, setHeartRate] = useState('');

  // Running pace
  const [distance, setDistance] = useState('');
  const [timeHours, setTimeHours] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');

  // Calculate BMR
  const ageNum = parseFloat(age);
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);

  let bmr: number | null = null;
  if (ageNum > 0 && weightNum > 0 && heightNum > 0) {
    if (bmrFormula === 'mifflin') {
      // Mifflin-St Jeor
      bmr = gender === 'male'
        ? 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5
        : 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    } else {
      // Harris-Benedict
      bmr = gender === 'male'
        ? 88.362 + 13.397 * weightNum + 4.799 * heightNum - 5.677 * ageNum
        : 447.593 + 9.247 * weightNum + 3.098 * heightNum - 4.330 * ageNum;
    }
  }

  const tdee = bmr && palFactor > 0 ? bmr * palFactor : null;

  // Heart rate category
  const heartRateNum = parseFloat(heartRate);
  const hrCategory = heartRateNum > 0 ? getHeartRateCategory(heartRateNum) : null;

  // Blood pressure references
  const bpReferences = ageNum > 0 ? getBloodPressureReferences(ageNum, gender) : null;

  // Running pace
  const distanceNum = parseFloat(distance);
  const totalSeconds = (parseInt(timeHours) || 0) * 3600 + (parseInt(timeMinutes) || 0) * 60 + (parseInt(timeSeconds) || 0);
  let pace: { minutes: number; seconds: number } | null = null;
  if (distanceNum > 0 && totalSeconds > 0) {
    const paceSeconds = totalSeconds / distanceNum;
    pace = {
      minutes: Math.floor(paceSeconds / 60),
      seconds: Math.round(paceSeconds % 60),
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MyHeder />

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseResult {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.4s ease-out forwards;
        }
        .animate-pulse-result {
          animation: pulseResult 0.6s ease-out;
        }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.15);
        }
        :global(.dark) .card-hover:hover {
          box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.4);
        }
        .tooltip-trigger {
          position: relative;
          cursor: help;
          border-bottom: 1px dashed currentColor;
        }
        .tooltip-trigger .tooltip-content {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          width: max(280px, 40vw);
          max-width: 380px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.5;
          z-index: 50;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
          background: #1e293b;
          color: #e2e8f0;
          box-shadow: 0 8px 24px -4px rgba(0,0,0,0.3);
        }
        :global(.dark) .tooltip-trigger .tooltip-content {
          background: #0f172a;
          border: 1px solid #334155;
        }
        .tooltip-trigger .tooltip-content::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #1e293b;
        }
        :global(.dark) .tooltip-trigger .tooltip-content::after {
          border-top-color: #0f172a;
        }
        .tooltip-trigger:hover .tooltip-content {
          visibility: visible;
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }
        @media (max-width: 640px) {
          .tooltip-trigger .tooltip-content {
            left: 0;
            transform: translateX(0) translateY(4px);
            width: calc(100vw - 80px);
            max-width: none;
          }
          .tooltip-trigger:hover .tooltip-content {
            transform: translateX(0) translateY(0);
          }
          .tooltip-trigger .tooltip-content::after {
            left: 20px;
            transform: none;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 mb-4">
            <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Fitness & Sport Calculator
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            BMR, resting heart rate, blood pressure references & running pace
          </p>
        </div>

        {/* Running Pace Calculator - Featured at top */}
        <div className="card-hover bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 border border-cyan-100 dark:border-gray-700" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Running Pace Calculator für Hannes Prohaska
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 ml-13">
            Calculate your pace per kilometer
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
            <div>
              <label htmlFor="distance" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Distance (km) <span className="text-red-500">*</span>
              </label>
              <input
                id="distance"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 10"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400')}
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Target time <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 sm:gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={timeHours}
                    onChange={(e) => setTimeHours(e.target.value)}
                    className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400') + ' pr-9'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500 pointer-events-none">h</span>
                </div>
                <span className="text-xl font-bold text-gray-400 dark:text-gray-500">:</span>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                    className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400') + ' pr-12'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500 pointer-events-none">min</span>
                </div>
                <span className="text-xl font-bold text-gray-400 dark:text-gray-500">:</span>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={timeSeconds}
                    onChange={(e) => setTimeSeconds(e.target.value)}
                    className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400') + ' pr-12'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500 pointer-events-none">sec</span>
                </div>
              </div>
            </div>
          </div>

          {pace ? (
            <div className="animate-scale-in bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-cyan-200 dark:border-cyan-800/50 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <span className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pace</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight">
                      {pace.minutes}:{pace.seconds.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <span className="block mt-1 text-sm sm:text-base font-semibold text-cyan-500/70 dark:text-cyan-400/60">min/km</span>
                </div>
                <div className="text-center border-l border-gray-200 dark:border-gray-700 pl-4">
                  <span className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Speed</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                      {(distanceNum / (totalSeconds / 3600)).toFixed(1)}
                    </span>
                  </div>
                  <span className="block mt-1 text-sm sm:text-base font-semibold text-blue-500/70 dark:text-blue-400/60">km/h</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">
              Enter distance and target time to calculate your pace.
            </div>
          )}
        </div>

        {/* Personal Data Section */}
        <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5 sm:mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/25">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Personal Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Gender */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 px-4 py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                    gender === 'male'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 px-4 py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                    gender === 'female'
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 scale-[1.02]'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                id="age"
                type="number"
                min="1"
                max="120"
                placeholder="e.g. 30"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                id="weight"
                type="number"
                min="1"
                max="500"
                step="0.1"
                placeholder="e.g. 75"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Height (cm) <span className="text-red-500">*</span>
              </label>
              <input
                id="height"
                type="number"
                min="1"
                max="300"
                step="0.1"
                placeholder="e.g. 180"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Calculator Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

          {/* A. BMR Calculator */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/25">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              Basal Metabolic Rate
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">
              Calculate your daily caloric baseline
            </p>

            {/* Formula Selection */}
            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Formula
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBmrFormula('mifflin')}
                  className={`flex-1 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    bmrFormula === 'mifflin'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                  }`}
                >
                  Mifflin-St Jeor
                </button>
                <button
                  onClick={() => setBmrFormula('harris')}
                  className={`flex-1 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    bmrFormula === 'harris'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                  }`}
                >
                  Harris-Benedict
                </button>
              </div>
            </div>

            {/* PAL Factor */}
            <div className="mb-5 sm:mb-6">
              <label htmlFor="pal" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Activity Level (optional)
              </label>
              <div className="relative">
                <select
                  id="pal"
                  value={palFactor}
                  onChange={(e) => setPalFactor(parseFloat(e.target.value))}
                  className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-orange-500/20 focus:border-orange-500 dark:focus:ring-orange-400/20 dark:focus:border-orange-400') + ' appearance-none pr-10 cursor-pointer'}
                >
                  <option value={0}>-- Select activity level --</option>
                  {palFactors.map((p) => (
                    <option key={p.value} value={p.value}>
                      PAL {p.value} - {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Result */}
            {bmr !== null ? (
              <div className="animate-scale-in bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 sm:p-6 space-y-3 border border-orange-200/50 dark:border-orange-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <div>
                    <span className="tooltip-trigger text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                      BMR
                      <span className="tooltip-content">
                        <strong>Grundumsatz (Basal Metabolic Rate)</strong><br />
                        Die Energie (Kalorien), die dein Körper im kompletten Ruhezustand verbraucht — ohne Bewegung, ohne Verdauung — nur um lebenswichtige Funktionen aufrechtzuerhalten: Atmen, Herzschlag, Körpertemperatur, Organfunktionen.<br />
                        <span style={{ opacity: 0.7 }}>Beispiel: 1.500–1.800 kcal bei den meisten Erwachsenen.</span>
                      </span>
                    </span>
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({bmrFormula === 'mifflin' ? 'Mifflin-St Jeor' : 'Harris-Benedict'})</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400 tracking-tight">
                    {Math.round(bmr)} <span className="text-base font-medium text-gray-500 dark:text-gray-400">kcal/day</span>
                  </span>
                </div>
                {tdee !== null && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-orange-200 dark:border-orange-800/50 pt-3">
                    <span className="tooltip-trigger text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                      TDEE
                      <span className="tooltip-content">
                        <strong>Total Daily Energy Expenditure</strong><br />
                        Der tatsächliche Gesamtverbrauch pro Tag = Grundumsatz + alle weiteren Aktivitäten:<br />
                        • Verdauung (Thermischer Effekt ≈ 10 %)<br />
                        • Alltagsbewegung (Gehen, Stehen, Treppen, Haushalt)<br />
                        • Sport / Training<br />
                        • NEAT (unbewusste Bewegungen wie Zappeln, Gestikulieren)
                      </span>
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
                      {Math.round(tdee)} <span className="text-base font-medium text-gray-500 dark:text-gray-400">kcal/day</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">
                Enter age, weight and height above to calculate.
              </div>
            )}
          </div>

          {/* B. Resting Heart Rate */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-md shadow-red-500/25">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              Heart Rate Analysis
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">
              Cardiovascular fitness & heart rate zones (Karvonen)
            </p>

            <div className="mb-5 sm:mb-6">
              <label htmlFor="heartrate" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Resting pulse (bpm) <span className="text-red-500">*</span>
              </label>
              <input
                id="heartrate"
                type="number"
                min="20"
                max="220"
                placeholder="e.g. 65"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-red-500/20 focus:border-red-500 dark:focus:ring-red-400/20 dark:focus:border-red-400')}
              />
            </div>

            {hrCategory ? (
              <div className="animate-scale-in space-y-4">
                {/* Classification */}
                <div className={`${hrCategory.bg} rounded-xl p-5 sm:p-6`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xl sm:text-2xl font-extrabold ${hrCategory.color}`}>
                      {hrCategory.label}
                    </span>
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/20 px-2.5 py-0.5 rounded-full">
                      {heartRateNum} bpm
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    {hrCategory.description}
                  </p>
                  {/* Scale visualization */}
                  <div className="mt-4 flex gap-1 h-3 rounded-full overflow-hidden">
                    <div className="flex-1 bg-blue-400 rounded-l-full" title="Athlete (<50)" />
                    <div className="flex-1 bg-green-400" title="Good (50-59)" />
                    <div className="flex-1 bg-yellow-400" title="Normal (60-80)" />
                    <div className="flex-1 bg-orange-400" title="Elevated (81-90)" />
                    <div className="flex-1 bg-red-400 rounded-r-full" title="High (>90)" />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span>Athlete</span>
                    <span>Good</span>
                    <span>Normal</span>
                    <span>Elevated</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Heart Rate Zones - requires age */}
                {ageNum > 0 ? (() => {
                  const maxHR = Math.round(220 - ageNum);
                  const hrr = maxHR - heartRateNum;
                  const avgHR = Math.round(heartRateNum + hrr * 0.5);
                  const zones = [
                    { name: 'Recovery', range: '50–60 %', low: Math.round(heartRateNum + hrr * 0.5), high: Math.round(heartRateNum + hrr * 0.6), color: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400' },
                    { name: 'Fat Burn', range: '60–70 %', low: Math.round(heartRateNum + hrr * 0.6), high: Math.round(heartRateNum + hrr * 0.7), color: 'bg-green-400', text: 'text-green-600 dark:text-green-400' },
                    { name: 'Aerobic', range: '70–80 %', low: Math.round(heartRateNum + hrr * 0.7), high: Math.round(heartRateNum + hrr * 0.8), color: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
                    { name: 'Anaerobic', range: '80–90 %', low: Math.round(heartRateNum + hrr * 0.8), high: Math.round(heartRateNum + hrr * 0.9), color: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400' },
                    { name: 'Maximum', range: '90–100 %', low: Math.round(heartRateNum + hrr * 0.9), high: maxHR, color: 'bg-red-400', text: 'text-red-600 dark:text-red-400' },
                  ];

                  return (
                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 sm:p-6 space-y-4">
                      {/* Key values */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <span className="tooltip-trigger block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Resting HR
                            <span className="tooltip-content">
                              <strong>Ruhepuls</strong><br />
                              Dein Puls in völliger Ruhe. Am besten morgens direkt nach dem Aufwachen messen. Ein niedriger Ruhepuls deutet auf gute Fitness hin.<br />
                              <span style={{ opacity: 0.7 }}>Normal: 60–80 bpm | Athlet: &lt;50 bpm</span>
                            </span>
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">{heartRateNum}</span>
                          <span className="block text-xs text-gray-400">bpm</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <span className="tooltip-trigger block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Avg HR
                            <span className="tooltip-content">
                              <strong>Durchschnittspuls (50 % HRR)</strong><br />
                              Geschätzter Durchschnittspuls bei moderater Alltagsaktivität, berechnet als Ruhepuls + 50 % der Herzfrequenzreserve (Karvonen-Methode).<br />
                              <span style={{ opacity: 0.7 }}>Entspricht ungefähr dem Puls bei leichter Bewegung.</span>
                            </span>
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-green-600 dark:text-green-400">{avgHR}</span>
                          <span className="block text-xs text-gray-400">bpm</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <span className="tooltip-trigger block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Max HR
                            <span className="tooltip-content">
                              <strong>Maximalpuls (220 − Alter)</strong><br />
                              Die theoretisch höchste Herzfrequenz, die dein Herz erreichen kann. Wird als Basis für die Berechnung der Trainingszonen verwendet.<br />
                              <span style={{ opacity: 0.7 }}>Formel: 220 − {Math.round(ageNum)} = {maxHR} bpm</span>
                            </span>
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-400">{maxHR}</span>
                          <span className="block text-xs text-gray-400">bpm</span>
                        </div>
                      </div>

                      {/* Training zones */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Training Zones (Karvonen)</h3>
                        <div className="space-y-1.5">
                          {zones.map((zone) => {
                            const widthPercent = ((zone.high - zone.low) / (maxHR - heartRateNum)) * 100;
                            const offsetPercent = ((zone.low - heartRateNum) / (maxHR - heartRateNum)) * 100;
                            return (
                              <div key={zone.name} className="flex items-center gap-2 sm:gap-3">
                                <span className={`text-xs sm:text-sm font-medium w-20 sm:w-24 ${zone.text}`}>{zone.name}</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 sm:h-5 relative overflow-hidden">
                                  <div
                                    className={`${zone.color} h-full rounded-full absolute`}
                                    style={{ left: `${offsetPercent}%`, width: `${widthPercent}%`, minWidth: '8px' }}
                                  />
                                </div>
                                <span className="text-xs sm:text-sm font-mono font-semibold text-gray-600 dark:text-gray-300 w-24 sm:w-28 text-right">
                                  {zone.low}–{zone.high} bpm
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        HRR (Heart Rate Reserve) = {maxHR} − {heartRateNum} = {hrr} bpm
                      </p>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center">
                    Enter your age above to see Max HR, Avg HR and training zones.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">
                Enter your resting heart rate to see your assessment.
              </div>
            )}
          </div>

          {/* C. Blood Pressure References */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/25">
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              Blood Pressure References
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">
              Typical values by age, gender & time of day (mmHg)
            </p>

            {bpReferences ? (
              <div className="animate-scale-in">
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-sm sm:text-base">
                    <thead>
                      <tr className="border-b-2 border-purple-200 dark:border-purple-800/50">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Time of Day</th>
                        <th className="text-left py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Systolic</th>
                        <th className="text-left py-3 font-semibold text-gray-600 dark:text-gray-400">Diastolic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bpReferences.map((ref) => (
                        <tr key={ref.period} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                          <td className="py-3.5 pr-4 text-gray-700 dark:text-gray-300 font-medium">{ref.period}</td>
                          <td className="py-3.5 pr-4 font-bold text-purple-600 dark:text-purple-400 text-lg">{ref.systolic}</td>
                          <td className="py-3.5 font-bold text-purple-600 dark:text-purple-400 text-lg">{ref.diastolic}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-4 italic">
                  Reference values for {gender === 'male' ? 'male' : 'female'}, age {Math.round(ageNum)}. Unit: mmHg.
                </p>
              </div>
            ) : (
              <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">
                Enter your age above to see reference values.
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 sm:mt-10 p-4 sm:p-5 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            <strong>Disclaimer:</strong> All values are approximations for informational purposes only and do not constitute medical advice.
            Consult a qualified healthcare professional for personalized health assessments and recommendations.
          </p>
        </div>
      </div>

      <MyFooter />
    </div>
  );
}
