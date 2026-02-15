'use client';

import { useState } from 'react';
import MyHeder from '../components/header';
import MyFooter from '../components/footer';
import { Activity, Heart, Gauge, Timer, ChevronDown, Globe } from 'lucide-react';

type Gender = 'male' | 'female';
type Lang = 'en' | 'de' | 'la';

// ─── Translations ───────────────────────────────────────────────────────────

const t: Record<string, Record<Lang, string>> = {
  title:            { en: 'Fitness & Sport Calculator', de: 'Fitness & Sport Rechner', la: 'Calculator Corporis & Ludi' },
  subtitle:         { en: 'BMR, heart rate analysis, blood pressure references & running pace', de: 'Grundumsatz, Herzfrequenz, Blutdruck-Referenzwerte & Lauftempo', la: 'BMR, pulsus cordis, pressio sanguinis & cursus tempus' },
  personalData:     { en: 'Personal Data', de: 'Persönliche Daten', la: 'Data Personalia' },
  gender:           { en: 'Gender', de: 'Geschlecht', la: 'Sexus' },
  male:             { en: 'Male', de: 'Männlich', la: 'Masculus' },
  female:           { en: 'Female', de: 'Weiblich', la: 'Femina' },
  age:              { en: 'Age', de: 'Alter', la: 'Aetas' },
  weightKg:         { en: 'Weight (kg)', de: 'Gewicht (kg)', la: 'Pondus (kg)' },
  heightCm:         { en: 'Height (cm)', de: 'Größe (cm)', la: 'Statura (cm)' },
  // Running Pace
  paceTitle:        { en: 'Running Pace Calculator für Hannes Prohaska', de: 'Lauftempo-Rechner für Hannes Prohaska', la: 'Calculator Cursus pro Hannes Prohaska' },
  paceSubtitle:     { en: 'Calculate your pace per kilometer', de: 'Berechne dein Tempo pro Kilometer', la: 'Computa tempus per chiliometrum' },
  distanceKm:       { en: 'Distance (km)', de: 'Distanz (km)', la: 'Distantia (km)' },
  targetTime:       { en: 'Target time', de: 'Zielzeit', la: 'Tempus destinatum' },
  pace:             { en: 'Pace', de: 'Tempo', la: 'Gradus' },
  speed:            { en: 'Speed', de: 'Geschwindigkeit', la: 'Velocitas' },
  paceEmpty:        { en: 'Enter distance and target time to calculate your pace.', de: 'Distanz und Zielzeit eingeben, um das Tempo zu berechnen.', la: 'Insere distantiam et tempus ad computandum.' },
  // BMR
  bmrTitle:         { en: 'Basal Metabolic Rate', de: 'Grundumsatz (BMR)', la: 'Metabolismus Basalis' },
  bmrSubtitle:      { en: 'Calculate your daily caloric baseline', de: 'Berechne deinen täglichen Kaloriengrundumsatz', la: 'Computa consumptionem caloricam diariam' },
  formula:          { en: 'Formula', de: 'Formel', la: 'Formula' },
  activityLevel:    { en: 'Activity Level (optional)', de: 'Aktivitätslevel (optional)', la: 'Gradus Activitatis (optio)' },
  selectActivity:   { en: '-- Select activity level --', de: '-- Aktivitätslevel wählen --', la: '-- Elige gradum --' },
  bmrEmpty:         { en: 'Enter age, weight and height above to calculate.', de: 'Alter, Gewicht und Größe oben eingeben.', la: 'Insere aetatem, pondus et staturam supra.' },
  // Heart Rate
  hrTitle:          { en: 'Heart Rate Analysis', de: 'Herzfrequenz-Analyse', la: 'Analysis Pulsus Cordis' },
  hrSubtitle:       { en: 'Estimated resting heart rate & training zones (Karvonen)', de: 'Geschätzter Ruhepuls & Trainingszonen (Karvonen)', la: 'Pulsus quiescens aestimatus & zonae exercitii (Karvonen)' },
  hrEstimated:      { en: 'Estimated resting heart rate based on your data', de: 'Geschätzter Ruhepuls basierend auf deinen Daten', la: 'Pulsus quiescens aestimatus ex datis tuis' },
  hrEmpty:          { en: 'Enter age, weight and height above to estimate your heart rate.', de: 'Alter, Gewicht und Größe oben eingeben, um den Ruhepuls zu schätzen.', la: 'Insere aetatem, pondus et staturam ad aestimandum pulsum.' },
  restingHR:        { en: 'Resting HR', de: 'Ruhepuls', la: 'Pulsus Quiesc.' },
  avgHR:            { en: 'Avg HR', de: 'Durchschn.', la: 'Pulsus Med.' },
  maxHR:            { en: 'Max HR', de: 'Maximalpuls', la: 'Pulsus Max.' },
  trainingZones:    { en: 'Training Zones (Karvonen)', de: 'Trainingszonen (Karvonen)', la: 'Zonae Exercitii (Karvonen)' },
  zoneRecovery:     { en: 'Recovery', de: 'Erholung', la: 'Recuperatio' },
  zoneFatBurn:      { en: 'Fat Burn', de: 'Fettverbr.', la: 'Adeps Comb.' },
  zoneAerobic:      { en: 'Aerobic', de: 'Aerob', la: 'Aerobicus' },
  zoneAnaerobic:    { en: 'Anaerobic', de: 'Anaerob', la: 'Anaerobicus' },
  zoneMaximum:      { en: 'Maximum', de: 'Maximum', la: 'Maximum' },
  // Blood Pressure
  bpTitle:          { en: 'Blood Pressure References', de: 'Blutdruck-Referenzwerte', la: 'Valores Pressionis Sanguinis' },
  bpSubtitle:       { en: 'Typical values by age, gender & time of day (mmHg)', de: 'Typische Werte nach Alter, Geschlecht & Tageszeit (mmHg)', la: 'Valores typici secundum aetatem, sexum & tempus diei (mmHg)' },
  timeOfDay:        { en: 'Time of Day', de: 'Tageszeit', la: 'Hora Diei' },
  systolic:         { en: 'Systolic', de: 'Systolisch', la: 'Systolicus' },
  diastolic:        { en: 'Diastolic', de: 'Diastolisch', la: 'Diastolicus' },
  morning:          { en: 'Morning', de: 'Morgens', la: 'Mane' },
  daytime:          { en: 'Daytime', de: 'Tagsüber', la: 'Interdiu' },
  evening:          { en: 'Evening', de: 'Abends', la: 'Vespere' },
  bpEmpty:          { en: 'Enter your age above to see reference values.', de: 'Alter oben eingeben, um Referenzwerte zu sehen.', la: 'Insere aetatem supra ad videndum valores.' },
  // Disclaimer
  disclaimer:       { en: 'All values are approximations for informational purposes only and do not constitute medical advice. Consult a qualified healthcare professional for personalized health assessments and recommendations.', de: 'Alle Werte sind Näherungswerte und dienen nur der Information. Sie ersetzen keine ärztliche Beratung. Konsultiere einen Arzt für persönliche Gesundheitsbewertungen.', la: 'Omnes valores sunt approximationes ad informationem solum. Medicum consule pro consiliis personalibus.' },
  // PAL labels
  palSedentary:     { en: 'Sedentary (office work, little exercise)', de: 'Sitzend (Büroarbeit, wenig Bewegung)', la: 'Sedentarius (opus officii)' },
  palLight:         { en: 'Lightly active (light exercise 1-3 days/week)', de: 'Leicht aktiv (leichter Sport 1-3 Tage/Woche)', la: 'Leviter activus (1-3 dies/hebd.)' },
  palModerate:      { en: 'Moderately active (moderate exercise 3-5 days/week)', de: 'Mäßig aktiv (mäßiger Sport 3-5 Tage/Woche)', la: 'Moderate activus (3-5 dies/hebd.)' },
  palVery:          { en: 'Very active (hard exercise 6-7 days/week)', de: 'Sehr aktiv (intensiver Sport 6-7 Tage/Woche)', la: 'Valde activus (6-7 dies/hebd.)' },
  palExtreme:       { en: 'Extremely active (athlete, physical job)', de: 'Extrem aktiv (Athlet, körperliche Arbeit)', la: 'Maxime activus (athleta, labor corporis)' },
  // HR categories
  catAthlete:       { en: 'Athlete', de: 'Athlet', la: 'Athleta' },
  catGood:          { en: 'Good', de: 'Gut', la: 'Bonus' },
  catNormal:        { en: 'Normal', de: 'Normal', la: 'Normalis' },
  catElevated:      { en: 'Elevated', de: 'Erhöht', la: 'Elevatus' },
  catHigh:          { en: 'High', de: 'Hoch', la: 'Altus' },
  catAthleteDesc:   { en: 'Excellent cardiovascular fitness, typical for trained endurance athletes.', de: 'Hervorragende kardiovaskuläre Fitness, typisch für trainierte Ausdauersportler.', la: 'Excellens valetudo cardiovascularis, typica pro athletis.' },
  catGoodDesc:      { en: 'Above average fitness level. Your heart works efficiently at rest.', de: 'Überdurchschnittliche Fitness. Dein Herz arbeitet in Ruhe effizient.', la: 'Supra mediocrem. Cor tuum efficienter quiescit.' },
  catNormalDesc:    { en: 'Within the normal range for a healthy adult at rest.', de: 'Im normalen Bereich für einen gesunden Erwachsenen in Ruhe.', la: 'Intra ambitum normalem pro adulto sano.' },
  catElevatedDesc:  { en: 'Slightly elevated. Consider regular aerobic exercise to improve cardiovascular health.', de: 'Leicht erhöht. Regelmäßiger Ausdauersport kann die Herzgesundheit verbessern.', la: 'Leviter elevatus. Considera exercitium aerobicum regulare.' },
  catHighDesc:      { en: 'Above normal range. Consult a physician if persistently elevated.', de: 'Über dem Normalbereich. Konsultiere einen Arzt bei dauerhaft erhöhtem Puls.', la: 'Supra ambitum normalem. Consule medicum si persistit.' },
};

const palFactorData = [
  { value: 1.2, key: 'palSedentary' as const },
  { value: 1.375, key: 'palLight' as const },
  { value: 1.55, key: 'palModerate' as const },
  { value: 1.725, key: 'palVery' as const },
  { value: 1.9, key: 'palExtreme' as const },
];

const inputClass = "w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500";

function getHeartRateCategoryKey(bpm: number) {
  if (bpm < 50) return { labelKey: 'catAthlete', descKey: 'catAthleteDesc', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' };
  if (bpm <= 59) return { labelKey: 'catGood', descKey: 'catGoodDesc', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' };
  if (bpm <= 80) return { labelKey: 'catNormal', descKey: 'catNormalDesc', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' };
  if (bpm <= 90) return { labelKey: 'catElevated', descKey: 'catElevatedDesc', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' };
  return { labelKey: 'catHigh', descKey: 'catHighDesc', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' };
}

function estimateRestingHR(age: number, gender: Gender, weightKg: number, heightCm: number): number {
  // Estimation based on age, gender, BMI correlation
  const bmi = weightKg / ((heightCm / 100) ** 2);
  const base = gender === 'male' ? 70 : 75;
  // Age factor: slightly higher for very young and old
  let ageFactor = 0;
  if (age < 20) ageFactor = 2;
  else if (age < 30) ageFactor = 0;
  else if (age < 40) ageFactor = -1;
  else if (age < 50) ageFactor = 0;
  else if (age < 60) ageFactor = 1;
  else ageFactor = 3;
  // BMI factor: higher BMI = higher RHR
  const bmiFactor = (bmi - 22) * 0.6;
  return Math.round(base + ageFactor + bmiFactor);
}

interface BPReference {
  periodKey: string;
  systolic: string;
  diastolic: string;
}

function getBloodPressureReferences(age: number, gender: Gender): BPReference[] {
  if (age < 18) {
    return [
      { periodKey: 'morning', systolic: '100-110', diastolic: '60-70' },
      { periodKey: 'daytime', systolic: '105-115', diastolic: '65-75' },
      { periodKey: 'evening', systolic: '100-110', diastolic: '60-70' },
    ];
  }
  if (age <= 39) {
    if (gender === 'male') {
      return [
        { periodKey: 'morning', systolic: '110-120', diastolic: '70-80' },
        { periodKey: 'daytime', systolic: '115-130', diastolic: '75-85' },
        { periodKey: 'evening', systolic: '110-120', diastolic: '70-80' },
      ];
    }
    return [
      { periodKey: 'morning', systolic: '105-115', diastolic: '65-75' },
      { periodKey: 'daytime', systolic: '110-125', diastolic: '70-80' },
      { periodKey: 'evening', systolic: '105-115', diastolic: '65-75' },
    ];
  }
  if (age <= 59) {
    if (gender === 'male') {
      return [
        { periodKey: 'morning', systolic: '115-130', diastolic: '75-85' },
        { periodKey: 'daytime', systolic: '120-135', diastolic: '80-90' },
        { periodKey: 'evening', systolic: '115-125', diastolic: '75-85' },
      ];
    }
    return [
      { periodKey: 'morning', systolic: '110-125', diastolic: '70-80' },
      { periodKey: 'daytime', systolic: '115-130', diastolic: '75-85' },
      { periodKey: 'evening', systolic: '110-120', diastolic: '70-80' },
    ];
  }
  if (gender === 'male') {
    return [
      { periodKey: 'morning', systolic: '120-135', diastolic: '75-85' },
      { periodKey: 'daytime', systolic: '125-140', diastolic: '80-90' },
      { periodKey: 'evening', systolic: '120-130', diastolic: '75-85' },
    ];
  }
  return [
    { periodKey: 'morning', systolic: '115-130', diastolic: '70-80' },
    { periodKey: 'daytime', systolic: '120-135', diastolic: '75-85' },
    { periodKey: 'evening', systolic: '115-125', diastolic: '70-80' },
  ];
}

export default function FitnessPage() {
  const [lang, setLang] = useState<Lang>('en');
  const l = (key: string) => t[key]?.[lang] ?? key;

  // Shared personal data
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // BMR calculator
  const [bmrFormula, setBmrFormula] = useState<'mifflin' | 'harris'>('mifflin');
  const [palFactor, setPalFactor] = useState(0);

  // Running pace
  const [distance, setDistance] = useState('');
  const [timeHours, setTimeHours] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');

  // Calculations
  const ageNum = parseFloat(age);
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);

  // BMR
  let bmr: number | null = null;
  if (ageNum > 0 && weightNum > 0 && heightNum > 0) {
    if (bmrFormula === 'mifflin') {
      bmr = gender === 'male'
        ? 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5
        : 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    } else {
      bmr = gender === 'male'
        ? 88.362 + 13.397 * weightNum + 4.799 * heightNum - 5.677 * ageNum
        : 447.593 + 9.247 * weightNum + 3.098 * heightNum - 4.330 * ageNum;
    }
  }
  const tdee = bmr && palFactor > 0 ? bmr * palFactor : null;

  // Estimated resting heart rate
  const estimatedRHR = (ageNum > 0 && weightNum > 0 && heightNum > 0)
    ? estimateRestingHR(ageNum, gender, weightNum, heightNum)
    : null;
  const hrCategory = estimatedRHR ? getHeartRateCategoryKey(estimatedRHR) : null;

  // Blood pressure
  const bpReferences = ageNum > 0 ? getBloodPressureReferences(ageNum, gender) : null;

  // Running pace
  const distanceNum = parseFloat(distance);
  const totalSeconds = (parseInt(timeHours) || 0) * 3600 + (parseInt(timeMinutes) || 0) * 60 + (parseInt(timeSeconds) || 0);
  let pace: { minutes: number; seconds: number } | null = null;
  if (distanceNum > 0 && totalSeconds > 0) {
    const paceSeconds = totalSeconds / distanceNum;
    pace = { minutes: Math.floor(paceSeconds / 60), seconds: Math.round(paceSeconds % 60) };
  }

  // Zone names translated
  const zoneNames = [l('zoneRecovery'), l('zoneFatBurn'), l('zoneAerobic'), l('zoneAnaerobic'), l('zoneMaximum')];

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
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px -8px rgba(0,0,0,0.15); }
        :global(.dark) .card-hover:hover { box-shadow: 0 12px 40px -8px rgba(0,0,0,0.4); }
        .tooltip-trigger { position: relative; cursor: help; border-bottom: 1px dashed currentColor; }
        .tooltip-trigger .tooltip-content {
          visibility: hidden; opacity: 0; position: absolute; bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%) translateY(4px); width: max(280px, 40vw); max-width: 380px;
          padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 400; line-height: 1.5;
          z-index: 50; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
          background: #1e293b; color: #e2e8f0; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.3);
        }
        :global(.dark) .tooltip-trigger .tooltip-content { background: #0f172a; border: 1px solid #334155; }
        .tooltip-trigger .tooltip-content::after {
          content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          border: 6px solid transparent; border-top-color: #1e293b;
        }
        :global(.dark) .tooltip-trigger .tooltip-content::after { border-top-color: #0f172a; }
        .tooltip-trigger:hover .tooltip-content {
          visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0); pointer-events: auto;
        }
        @media (max-width: 640px) {
          .tooltip-trigger .tooltip-content { left: 0; transform: translateX(0) translateY(4px); width: calc(100vw - 80px); max-width: none; }
          .tooltip-trigger:hover .tooltip-content { transform: translateX(0) translateY(0); }
          .tooltip-trigger .tooltip-content::after { left: 20px; transform: none; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">

        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <Globe className="w-4 h-4 text-gray-400 ml-2" />
            {(['en', 'de', 'la'] as Lang[]).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  lang === code
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {code === 'en' ? 'EN' : code === 'de' ? 'DE' : 'LA'}
              </button>
            ))}
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 mb-4">
            <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {l('title')}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">{l('subtitle')}</p>
        </div>

        {/* Running Pace Calculator */}
        <div className="card-hover bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 border border-cyan-100 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            {l('paceTitle')}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 ml-13">{l('paceSubtitle')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
            <div>
              <label htmlFor="distance" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {l('distanceKm')} <span className="text-red-500">*</span>
              </label>
              <input id="distance" type="number" min="0.1" step="0.1" placeholder="e.g. 10" value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400')} />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {l('targetTime')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 sm:gap-3 items-center">
                {[{ val: timeHours, set: setTimeHours, label: 'h', pr: 'pr-9' }, { val: timeMinutes, set: setTimeMinutes, label: 'min', pr: 'pr-12', max: 59 }, { val: timeSeconds, set: setTimeSeconds, label: 'sec', pr: 'pr-12', max: 59 }].map((f, i) => (
                  <>{i > 0 && <span className="text-xl font-bold text-gray-400 dark:text-gray-500">:</span>}
                  <div key={f.label} className="flex-1 relative">
                    <input type="number" min="0" max={f.max} placeholder="0" value={f.val} onChange={(e) => f.set(e.target.value)}
                      className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400') + ' ' + f.pr} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 dark:text-gray-500 pointer-events-none">{f.label}</span>
                  </div></>
                ))}
              </div>
            </div>
          </div>

          {pace ? (
            <div className="animate-scale-in bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-cyan-200 dark:border-cyan-800/50 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <span className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{l('pace')}</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight">
                    {pace.minutes}:{pace.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="block mt-1 text-sm sm:text-base font-semibold text-cyan-500/70 dark:text-cyan-400/60">min/km</span>
                </div>
                <div className="text-center border-l border-gray-200 dark:border-gray-700 pl-4">
                  <span className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{l('speed')}</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                    {(distanceNum / (totalSeconds / 3600)).toFixed(1)}
                  </span>
                  <span className="block mt-1 text-sm sm:text-base font-semibold text-blue-500/70 dark:text-blue-400/60">km/h</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">{l('paceEmpty')}</div>
          )}
        </div>

        {/* Personal Data */}
        <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5 sm:mb-6 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/25">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            {l('personalData')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {l('gender')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`flex-1 px-4 py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 ${
                      gender === g
                        ? g === 'male' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                       : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 scale-[1.02]'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                    }`}>
                    {l(g)}
                  </button>
                ))}
              </div>
            </div>
            {[{ id: 'age', key: 'age', val: age, set: setAge, min: 1, max: 120, ph: 'e.g. 30' },
              { id: 'weight', key: 'weightKg', val: weight, set: setWeight, min: 1, max: 500, ph: 'e.g. 75', step: 0.1 },
              { id: 'height', key: 'heightCm', val: height, set: setHeight, min: 1, max: 300, ph: 'e.g. 180', step: 0.1 }
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {l(f.key)} <span className="text-red-500">*</span>
                </label>
                <input id={f.id} type="number" min={f.min} max={f.max} step={f.step} placeholder={f.ph}
                  value={f.val} onChange={(e) => f.set(e.target.value)} className={inputClass} />
              </div>
            ))}
          </div>
        </div>

        {/* Calculator Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

          {/* BMR Calculator */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/25">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {l('bmrTitle')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">{l('bmrSubtitle')}</p>

            <div className="mb-5 sm:mb-6">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('formula')}</label>
              <div className="flex gap-2">
                {(['mifflin', 'harris'] as const).map((f) => (
                  <button key={f} onClick={() => setBmrFormula(f)}
                    className={`flex-1 px-3 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      bmrFormula === f
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-[1.02]'
                    }`}>
                    {f === 'mifflin' ? 'Mifflin-St Jeor' : 'Harris-Benedict'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5 sm:mb-6">
              <label htmlFor="pal" className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('activityLevel')}</label>
              <div className="relative">
                <select id="pal" value={palFactor} onChange={(e) => setPalFactor(parseFloat(e.target.value))}
                  className={inputClass.replace('focus:ring-green-500/20 focus:border-green-500 dark:focus:ring-green-400/20 dark:focus:border-green-400', 'focus:ring-orange-500/20 focus:border-orange-500 dark:focus:ring-orange-400/20 dark:focus:border-orange-400') + ' appearance-none pr-10 cursor-pointer'}>
                  <option value={0}>{l('selectActivity')}</option>
                  {palFactorData.map((p) => (
                    <option key={p.value} value={p.value}>PAL {p.value} - {l(p.key)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {bmr !== null ? (
              <div className="animate-scale-in bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 sm:p-6 space-y-3 border border-orange-200/50 dark:border-orange-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <div>
                    <span className="tooltip-trigger text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                      BMR
                      <span className="tooltip-content">
                        <strong>{lang === 'de' ? 'Grundumsatz (Basal Metabolic Rate)' : lang === 'la' ? 'Metabolismus Basalis' : 'Basal Metabolic Rate'}</strong><br />
                        {lang === 'de' ? 'Die Energie (Kalorien), die dein Körper im kompletten Ruhezustand verbraucht — ohne Bewegung, ohne Verdauung — nur um lebenswichtige Funktionen aufrechtzuerhalten: Atmen, Herzschlag, Körpertemperatur, Organfunktionen.' :
                         lang === 'la' ? 'Energia quam corpus tuum in quiete consumit ad functiones vitales sustinendas: respirationem, pulsationem cordis, temperaturam corporis.' :
                         'The energy (calories) your body burns at complete rest — no movement, no digestion — just to maintain vital functions: breathing, heartbeat, body temperature, organs.'}<br />
                        <span style={{ opacity: 0.7 }}>{lang === 'de' ? 'Beispiel: 1.500–1.800 kcal bei den meisten Erwachsenen.' : lang === 'la' ? 'Exemplum: 1.500–1.800 kcal pro adultis.' : 'Example: 1,500–1,800 kcal for most adults.'}</span>
                      </span>
                    </span>
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({bmrFormula === 'mifflin' ? 'Mifflin-St Jeor' : 'Harris-Benedict'})</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400 tracking-tight">
                    {Math.round(bmr)} <span className="text-base font-medium text-gray-500 dark:text-gray-400">kcal/{lang === 'de' ? 'Tag' : lang === 'la' ? 'diem' : 'day'}</span>
                  </span>
                </div>
                {tdee !== null && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-orange-200 dark:border-orange-800/50 pt-3">
                    <span className="tooltip-trigger text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                      TDEE
                      <span className="tooltip-content">
                        <strong>Total Daily Energy Expenditure</strong><br />
                        {lang === 'de' ? 'Der tatsächliche Gesamtverbrauch pro Tag = Grundumsatz + alle weiteren Aktivitäten:' :
                         lang === 'la' ? 'Consumptio totalis diaria = BMR + omnes activitates:' :
                         'Your actual total daily burn = BMR + all activities:'}<br />
                        {lang === 'de' ? '• Verdauung (Thermischer Effekt ≈ 10 %)\n• Alltagsbewegung\n• Sport / Training\n• NEAT (unbewusste Bewegungen)' :
                         lang === 'la' ? '• Digestio (≈ 10 %)\n• Motus quotidianus\n• Exercitium\n• NEAT (motus inconscii)' :
                         '• Digestion (Thermic Effect ≈ 10 %)\n• Daily movement\n• Exercise / Training\n• NEAT (unconscious movements)'}
                      </span>
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
                      {Math.round(tdee)} <span className="text-base font-medium text-gray-500 dark:text-gray-400">kcal/{lang === 'de' ? 'Tag' : lang === 'la' ? 'diem' : 'day'}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">{l('bmrEmpty')}</div>
            )}
          </div>

          {/* Heart Rate Analysis */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-md shadow-red-500/25">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {l('hrTitle')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">{l('hrSubtitle')}</p>

            {estimatedRHR && hrCategory ? (
              <div className="animate-scale-in space-y-4">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">{l('hrEstimated')}</p>

                {/* Classification */}
                <div className={`${hrCategory.bg} rounded-xl p-5 sm:p-6`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xl sm:text-2xl font-extrabold ${hrCategory.color}`}>{l(hrCategory.labelKey)}</span>
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-black/20 px-2.5 py-0.5 rounded-full">
                      ~{estimatedRHR} bpm
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{l(hrCategory.descKey)}</p>
                  <div className="mt-4 flex gap-1 h-3 rounded-full overflow-hidden">
                    <div className="flex-1 bg-blue-400 rounded-l-full" title={l('catAthlete')} />
                    <div className="flex-1 bg-green-400" title={l('catGood')} />
                    <div className="flex-1 bg-yellow-400" title={l('catNormal')} />
                    <div className="flex-1 bg-orange-400" title={l('catElevated')} />
                    <div className="flex-1 bg-red-400 rounded-r-full" title={l('catHigh')} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span>{l('catAthlete')}</span><span>{l('catGood')}</span><span>{l('catNormal')}</span><span>{l('catElevated')}</span><span>{l('catHigh')}</span>
                  </div>
                </div>

                {/* Zones */}
                {(() => {
                  const maxHR = Math.round(220 - ageNum);
                  const hrr = maxHR - estimatedRHR;
                  const avgHR = Math.round(estimatedRHR + hrr * 0.5);
                  const zones = [
                    { name: zoneNames[0], low: Math.round(estimatedRHR + hrr * 0.5), high: Math.round(estimatedRHR + hrr * 0.6), color: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400' },
                    { name: zoneNames[1], low: Math.round(estimatedRHR + hrr * 0.6), high: Math.round(estimatedRHR + hrr * 0.7), color: 'bg-green-400', text: 'text-green-600 dark:text-green-400' },
                    { name: zoneNames[2], low: Math.round(estimatedRHR + hrr * 0.7), high: Math.round(estimatedRHR + hrr * 0.8), color: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400' },
                    { name: zoneNames[3], low: Math.round(estimatedRHR + hrr * 0.8), high: Math.round(estimatedRHR + hrr * 0.9), color: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400' },
                    { name: zoneNames[4], low: Math.round(estimatedRHR + hrr * 0.9), high: maxHR, color: 'bg-red-400', text: 'text-red-600 dark:text-red-400' },
                  ];
                  return (
                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 sm:p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <span className="tooltip-trigger block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {l('restingHR')}
                            <span className="tooltip-content">
                              <strong>{lang === 'de' ? 'Ruhepuls' : lang === 'la' ? 'Pulsus Quiescens' : 'Resting Heart Rate'}</strong><br />
                              {lang === 'de' ? 'Geschätzter Ruhepuls basierend auf Alter, Geschlecht und BMI. Am besten morgens nach dem Aufwachen messen.' :
                               lang === 'la' ? 'Pulsus quiescens aestimatus ex aetate, sexu et BMI.' :
                               'Estimated resting heart rate based on age, gender and BMI. Best measured in the morning after waking.'}
                            </span>
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">~{estimatedRHR}</span>
                          <span className="block text-xs text-gray-400">bpm</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <span className="tooltip-trigger block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {l('avgHR')}
                            <span className="tooltip-content">
                              <strong>{lang === 'de' ? 'Durchschnittspuls (50 % HRR)' : lang === 'la' ? 'Pulsus Medius (50 % HRR)' : 'Average HR (50 % HRR)'}</strong><br />
                              {lang === 'de' ? 'Geschätzter Durchschnittspuls bei moderater Alltagsaktivität (Karvonen-Methode).' :
                               lang === 'la' ? 'Pulsus medius aestimatus in activitate moderata (methodus Karvonen).' :
                               'Estimated average heart rate during moderate daily activity (Karvonen method).'}
                            </span>
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-green-600 dark:text-green-400">{avgHR}</span>
                          <span className="block text-xs text-gray-400">bpm</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                          <span className="tooltip-trigger block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {l('maxHR')}
                            <span className="tooltip-content">
                              <strong>{lang === 'de' ? 'Maximalpuls (220 − Alter)' : lang === 'la' ? 'Pulsus Maximus (220 − Aetas)' : 'Maximum HR (220 − Age)'}</strong><br />
                              {lang === 'de' ? `Die theoretisch höchste Herzfrequenz. Formel: 220 − ${Math.round(ageNum)} = ${maxHR} bpm` :
                               lang === 'la' ? `Frequentia cordis maxima theoretica. Formula: 220 − ${Math.round(ageNum)} = ${maxHR} bpm` :
                               `The theoretical maximum heart rate. Formula: 220 − ${Math.round(ageNum)} = ${maxHR} bpm`}
                            </span>
                          </span>
                          <span className="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-400">{maxHR}</span>
                          <span className="block text-xs text-gray-400">bpm</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{l('trainingZones')}</h3>
                        <div className="space-y-1.5">
                          {zones.map((zone) => {
                            const widthPercent = ((zone.high - zone.low) / (maxHR - estimatedRHR)) * 100;
                            const offsetPercent = ((zone.low - estimatedRHR) / (maxHR - estimatedRHR)) * 100;
                            return (
                              <div key={zone.name} className="flex items-center gap-2 sm:gap-3">
                                <span className={`text-xs sm:text-sm font-medium w-20 sm:w-24 ${zone.text}`}>{zone.name}</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 sm:h-5 relative overflow-hidden">
                                  <div className={`${zone.color} h-full rounded-full absolute`}
                                    style={{ left: `${offsetPercent}%`, width: `${widthPercent}%`, minWidth: '8px' }} />
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
                        HRR (Heart Rate Reserve) = {maxHR} − {estimatedRHR} = {hrr} bpm
                      </p>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">{l('hrEmpty')}</div>
            )}
          </div>

          {/* Blood Pressure References */}
          <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/25">
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {l('bpTitle')}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">{l('bpSubtitle')}</p>

            {bpReferences ? (
              <div className="animate-scale-in">
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-sm sm:text-base">
                    <thead>
                      <tr className="border-b-2 border-purple-200 dark:border-purple-800/50">
                        <th className="text-left py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">{l('timeOfDay')}</th>
                        <th className="text-left py-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">{l('systolic')}</th>
                        <th className="text-left py-3 font-semibold text-gray-600 dark:text-gray-400">{l('diastolic')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bpReferences.map((ref) => (
                        <tr key={ref.periodKey} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                          <td className="py-3.5 pr-4 text-gray-700 dark:text-gray-300 font-medium">{l(ref.periodKey)}</td>
                          <td className="py-3.5 pr-4 font-bold text-purple-600 dark:text-purple-400 text-lg">{ref.systolic}</td>
                          <td className="py-3.5 font-bold text-purple-600 dark:text-purple-400 text-lg">{ref.diastolic}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-4 italic">
                  {lang === 'de' ? `Referenzwerte für ${gender === 'male' ? 'männlich' : 'weiblich'}, Alter ${Math.round(ageNum)}. Einheit: mmHg.` :
                   lang === 'la' ? `Valores pro ${gender === 'male' ? 'masculo' : 'femina'}, aetas ${Math.round(ageNum)}. Unitas: mmHg.` :
                   `Reference values for ${gender === 'male' ? 'male' : 'female'}, age ${Math.round(ageNum)}. Unit: mmHg.`}
                </p>
              </div>
            ) : (
              <div className="text-sm sm:text-base text-gray-400 dark:text-gray-500 italic text-center py-4">{l('bpEmpty')}</div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 sm:mt-10 p-4 sm:p-5 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            <strong>Disclaimer:</strong> {l('disclaimer')}
          </p>
        </div>
      </div>

      <MyFooter />
    </div>
  );
}
