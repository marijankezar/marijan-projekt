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
  const [palFactor, setPalFactor] = useState(0);

  // Heart rate
  const [heartRate, setHeartRate] = useState('');

  // Running pace
  const [distance, setDistance] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');

  // Calculate BMR
  const ageNum = parseFloat(age);
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);

  let bmr: number | null = null;
  if (ageNum > 0 && weightNum > 0 && heightNum > 0) {
    if (gender === 'male') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
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
  const totalSeconds = (parseInt(timeMinutes) || 0) * 60 + (parseInt(timeSeconds) || 0);
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Fitness & Sport Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            BMR, resting heart rate, blood pressure references & running pace
          </p>
        </div>

        {/* Personal Data Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Personal Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    gender === 'male'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    gender === 'female'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Calculator Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* A. BMR Calculator */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              Basal Metabolic Rate (BMR)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Mifflin-St Jeor equation
            </p>

            {/* PAL Factor */}
            <div className="mb-4">
              <label htmlFor="pal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Level (optional)
              </label>
              <div className="relative">
                <select
                  id="pal"
                  value={palFactor}
                  onChange={(e) => setPalFactor(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none pr-8"
                >
                  <option value={0}>-- Select activity level --</option>
                  {palFactors.map((p) => (
                    <option key={p.value} value={p.value}>
                      PAL {p.value} - {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Result */}
            {bmr !== null ? (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">BMR</span>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(bmr)} kcal/day
                  </span>
                </div>
                {tdee !== null && (
                  <div className="flex justify-between items-center border-t border-orange-200 dark:border-orange-800 pt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">TDEE (Total Daily Energy Expenditure)</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(tdee)} kcal/day
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                Enter age, weight and height above to calculate.
              </div>
            )}
          </div>

          {/* B. Resting Heart Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              Resting Heart Rate
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Cardiovascular fitness assessment
            </p>

            <div className="mb-4">
              <label htmlFor="heartrate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {hrCategory ? (
              <div className={`${hrCategory.bg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg font-bold ${hrCategory.color}`}>
                    {hrCategory.label}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({heartRateNum} bpm)
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {hrCategory.description}
                </p>
                {/* Scale visualization */}
                <div className="mt-3 flex gap-1 h-2 rounded-full overflow-hidden">
                  <div className="flex-1 bg-blue-400" title="Athlete (<50)" />
                  <div className="flex-1 bg-green-400" title="Good (50-59)" />
                  <div className="flex-1 bg-yellow-400" title="Normal (60-80)" />
                  <div className="flex-1 bg-orange-400" title="Elevated (81-90)" />
                  <div className="flex-1 bg-red-400" title="High (>90)" />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>Athlete</span>
                  <span>Good</span>
                  <span>Normal</span>
                  <span>Elevated</span>
                  <span>High</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                Enter your resting heart rate to see your assessment.
              </div>
            )}
          </div>

          {/* C. Blood Pressure References */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              Blood Pressure References
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Typical values by age, gender & time of day (mmHg)
            </p>

            {bpReferences ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Time of Day</th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Systolic</th>
                        <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">Diastolic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bpReferences.map((ref) => (
                        <tr key={ref.period} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{ref.period}</td>
                          <td className="py-2 pr-4 font-medium text-purple-600 dark:text-purple-400">{ref.systolic}</td>
                          <td className="py-2 font-medium text-purple-600 dark:text-purple-400">{ref.diastolic}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 italic">
                  Reference values for {gender === 'male' ? 'male' : 'female'}, age {Math.round(ageNum)}. Unit: mmHg.
                </p>
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                Enter your age above to see reference values.
              </div>
            )}
          </div>

          {/* D. Running Pace Calculator */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                <Timer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              Running Pace Calculator
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Calculate your pace per kilometer
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="distance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target time <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="min"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
                  </div>
                  <span className="flex items-center text-gray-500 dark:text-gray-400 font-bold">:</span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="sec"
                      value={timeSeconds}
                      onChange={(e) => setTimeSeconds(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">sec</span>
                  </div>
                </div>
              </div>
            </div>

            {pace ? (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pace</span>
                  <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {pace.minutes}:{pace.seconds.toString().padStart(2, '0')} min/km
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Speed</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {(distanceNum / (totalSeconds / 3600)).toFixed(1)} km/h
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                Enter distance and target time to calculate your pace.
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <strong>Disclaimer:</strong> All values are approximations for informational purposes only and do not constitute medical advice.
            Consult a qualified healthcare professional for personalized health assessments and recommendations.
          </p>
        </div>
      </div>

      <MyFooter />
    </div>
  );
}
