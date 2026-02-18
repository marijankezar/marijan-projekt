'use client';

import { useState } from 'react';
import { Timer } from 'lucide-react';

const inputClass =
  'w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 dark:focus:ring-cyan-400/20 dark:focus:border-cyan-400 outline-none transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-gray-300 dark:hover:border-gray-500';

const raceDistances = [
  { label: '1 km', km: 1 },
  { label: '5 km', km: 5 },
  { label: '10 km', km: 10 },
  { label: 'Halbmarathon (21.097 km)', km: 21.097 },
  { label: 'Marathon (42.195 km)', km: 42.195 },
];

export default function RunningPace() {
  const [distance, setDistance] = useState('');
  const [timeHours, setTimeHours] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('');

  const distanceNum = parseFloat(distance);
  const totalSeconds =
    (parseInt(timeHours) || 0) * 3600 +
    (parseInt(timeMinutes) || 0) * 60 +
    (parseInt(timeSeconds) || 0);

  let pace: { minutes: number; seconds: number } | null = null;
  let speed: number | null = null;
  if (distanceNum > 0 && totalSeconds > 0) {
    const paceSeconds = totalSeconds / distanceNum;
    pace = { minutes: Math.floor(paceSeconds / 60), seconds: Math.round(paceSeconds % 60) };
    speed = distanceNum / (totalSeconds / 3600);
  }

  // Splits für gängige Renndistanzen auf Basis des aktuellen Tempos
  const splits = pace
    ? raceDistances.map((r) => {
        const totalSec = (pace!.minutes * 60 + pace!.seconds) * r.km;
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = Math.round(totalSec % 60);
        return { ...r, time: h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}` };
      })
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
          <Timer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lauftempo-Rechner</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tempo (min/km) und Geschwindigkeit (km/h) aus Distanz und Zielzeit berechnen
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Distanz */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Distanz (km) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="0.1" step="0.1"
            placeholder="z.B. 10"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className={inputClass}
          />
          {/* Schnellauswahl */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[1, 5, 10, 21.097, 42.195].map((d) => (
              <button
                key={d}
                onClick={() => setDistance(String(d))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
              >
                {d === 21.097 ? 'HM' : d === 42.195 ? 'M' : `${d} km`}
              </button>
            ))}
          </div>
        </div>

        {/* Zeit */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Zielzeit <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-center">
            {[
              { val: timeHours, set: setTimeHours, label: 'h', ph: '0' },
              { val: timeMinutes, set: setTimeMinutes, label: 'min', ph: '45', max: 59 },
              { val: timeSeconds, set: setTimeSeconds, label: 'sek', ph: '00', max: 59 },
            ].map((f, i) => (
              <span key={f.label} className="contents">
                {i > 0 && <span className="text-xl font-bold text-gray-400">:</span>}
                <div className="flex-1 relative">
                  <input
                    type="number" min="0" max={f.max}
                    placeholder={f.ph}
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{f.label}</span>
                </div>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Ergebnis */}
      {pace && speed ? (
        <div className="animate-scale-in space-y-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-cyan-500/25">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="block text-xs opacity-80 uppercase tracking-wider mb-2">Tempo</span>
                <span className="text-4xl sm:text-5xl font-extrabold">
                  {pace.minutes}:{String(pace.seconds).padStart(2, '0')}
                </span>
                <span className="block text-sm opacity-70 mt-1">min/km</span>
              </div>
              <div className="text-center border-l border-white/30 pl-4">
                <span className="block text-xs opacity-80 uppercase tracking-wider mb-2">Geschwindigkeit</span>
                <span className="text-4xl sm:text-5xl font-extrabold">{speed.toFixed(1)}</span>
                <span className="block text-sm opacity-70 mt-1">km/h</span>
              </div>
            </div>
          </div>

          {/* Splits Tabelle */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Hochrechnung auf Renndistanzen</p>
            <div className="space-y-2">
              {splits!.map((s) => (
                <div key={s.km} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-2.5 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{s.label}</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          Distanz und Zielzeit eingeben, um das Tempo zu berechnen.
        </div>
      )}
    </div>
  );
}
