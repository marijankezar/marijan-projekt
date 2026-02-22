'use client';

import { Music, Timer, ChevronDown, MapPin, Clock, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import MyHeader from '../components/header';

type Lang = 'de' | 'sl' | 'la';

const translations = {
  de: {
    countdown: 'Countdown zum nächsten Termin',
    nextBadge: 'Nächster Termin',
    upcoming: 'Kommende Termine',
    archive: 'Archiv',
    termineCount: 'Termine',
    at: 'um', oclock: 'Uhr',
    loading: 'Wird geladen…',
    error: 'Fehler beim Laden',
    days: 'TAGE', hours: 'STD', min: 'MIN', sec: 'SEK',
  },
  sl: {
    countdown: 'Odštevalnik do naslednjega termina',
    nextBadge: 'Naslednji Termin',
    upcoming: 'Prihajajoči Termini',
    archive: 'Arhiv',
    termineCount: 'terminov',
    at: 'ob', oclock: 'uri',
    loading: 'Nalaganje terminov…',
    error: 'Napaka pri nalaganju',
    days: 'DNI', hours: 'UR', min: 'MIN', sec: 'SEK',
  },
  la: {
    countdown: 'Numeratio ad eventum proximum',
    nextBadge: 'Proximus Eventus',
    upcoming: 'Eventa Futura',
    archive: 'Archivum',
    termineCount: 'eventuum',
    at: 'hora', oclock: '',
    loading: 'Oneratur…',
    error: 'Error in onerando',
    days: 'DIES', hours: 'HORAE', min: 'MIN', sec: 'SEC',
  },
};

type T = typeof translations.de;

// Countdown Component
function Countdown({ targetDate, targetTime, eventName, t }: {
  targetDate: string;
  targetTime: string;
  eventName: string;
  t: T;
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateTime = () => {
      const [h, m] = targetTime.split(':').map(Number);
      const target = new Date(targetDate);
      target.setHours(h || 19, m || 0, 0, 0);
      const diff = target.getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  if (!mounted) return null;

  const units = [
    { value: timeLeft.days, label: t.days },
    { value: timeLeft.hours, label: t.hours },
    { value: timeLeft.minutes, label: t.min },
    { value: timeLeft.seconds, label: t.sec },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 text-center">
      <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs uppercase tracking-widest mb-3">
        <Timer className="w-4 h-4 text-amber-400" />
        <span>{t.countdown}</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-6">{eventName}</h3>
      <div className="flex justify-center gap-3 sm:gap-4">
        {units.map((unit, i) => (
          <div
            key={i}
            className="w-16 h-20 sm:w-20 sm:h-24 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col items-center justify-center"
          >
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 leading-none">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Termin {
  id: number;
  titel: string;
  datum: string;
  datumText: string;
  ort: string;
  zeit: string;
  beschreibung?: string;
  jahr: number;
}

interface TermineData {
  meta: { titel: string; untertitel: string; autor: string };
  termine: Termin[];
}

function EventCard({ termin, index, isNext, t }: { termin: Termin; index: number; isNext: boolean; t: T }) {
  return (
    <div
      className="relative border border-zinc-800 hover:border-amber-500/40 bg-zinc-900/40 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5"
      style={{ opacity: 0, animation: `fadeInUp 0.5s ease-out ${index * 100}ms forwards` }}
    >
      {isNext && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 text-xs font-bold uppercase tracking-widest bg-amber-500 text-zinc-950 rounded-full">
            {t.nextBadge}
          </span>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-amber-400/70 text-sm mb-2">
        <Calendar className="w-3.5 h-3.5" />
        {termin.datumText}
      </p>

      <p className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">{termin.titel}</p>

      {termin.beschreibung && (
        <p className="text-sm text-zinc-500 italic mb-2">{termin.beschreibung}</p>
      )}

      {termin.ort && (
        <p className="flex items-center justify-center gap-1 text-sm text-zinc-500 mb-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {termin.ort}
        </p>
      )}

      {termin.zeit && (
        <p className="flex items-center justify-center gap-1 text-sm text-zinc-600">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {t.at} {termin.zeit} {t.oclock}
        </p>
      )}
    </div>
  );
}

function CompactCard({ termin, index, t }: { termin: Termin; index: number; t: T }) {
  return (
    <div
      className="border border-zinc-800/60 hover:bg-zinc-900 rounded-xl px-4 py-3 transition-colors"
      style={{ opacity: 0, animation: `fadeIn 0.4s ease-out ${index * 40}ms forwards` }}
    >
      <p className="text-xs text-zinc-700 mb-0.5">{termin.datumText}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-zinc-300 flex-1 min-w-0">{termin.titel}</span>
        {termin.ort && <span className="text-xs text-zinc-600 shrink-0">{termin.ort}</span>}
        {termin.zeit && (
          <span className="text-xs text-amber-600/70 shrink-0">{t.at} {termin.zeit} {t.oclock}</span>
        )}
      </div>
    </div>
  );
}

export default function TerminePage() {
  const [termineData, setTermineData] = useState<TermineData | null>(null);
  const [showArchive, setShowArchive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('de');

  // Restore language from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('termine_lang') as Lang | null;
    if (saved && ['de', 'sl', 'la'].includes(saved)) setLang(saved);
  }, []);

  const handleLangChange = (l: Lang) => {
    setLang(l);
    localStorage.setItem('termine_lang', l);
  };

  useEffect(() => {
    fetch('/data/termine.json')
      .then(res => res.json())
      .then(data => { setTermineData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const t = translations[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!termineData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">{t.error}</p>
      </div>
    );
  }

  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const isVergangen = (datum: string) => new Date(datum) < heute;

  const years = [2026, 2025, 2024, 2023, 2022];
  const termineByYear: Record<number, Termin[]> = {};
  years.forEach(year => {
    termineByYear[year] = termineData.termine
      .filter(item => item.jahr === year)
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
  });

  const kommendeTermine = termineData.termine
    .filter(item => !isVergangen(item.datum))
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
  const nextEvent = kommendeTermine[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <MyHeader />

      {/* Hero */}
      <header className="relative py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.07)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
            <Music className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2">
            {termineData.meta.titel}
          </h1>
          <p className="text-zinc-600 text-xs uppercase tracking-[0.25em] mb-2">
            Termine 2022 — 2026
          </p>
          <p className="text-zinc-500 text-sm mb-8">{termineData.meta.untertitel}</p>

          {/* Language Switcher */}
          <div className="flex justify-center">
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1">
              {(['de', 'sl', 'la'] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all ${
                    lang === l
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        {/* Countdown */}
        {nextEvent && (
          <Countdown
            targetDate={nextEvent.datum}
            targetTime={nextEvent.zeit}
            eventName={nextEvent.titel}
            t={t}
          />
        )}

        {/* Kommende Termine */}
        {kommendeTermine.length > 0 && (
          <section className="mb-10">
            <h2 className="flex items-center gap-3 text-base font-bold text-zinc-200 uppercase tracking-widest mb-5">
              <span className="w-1 h-4 bg-amber-500 rounded-full shrink-0" />
              {t.upcoming}
              <span className="ml-auto text-xs font-normal text-zinc-700 normal-case tracking-normal">
                {kommendeTermine.length} {t.termineCount}
              </span>
            </h2>
            <div className="flex flex-col gap-4">
              {kommendeTermine.map((termin, index) => (
                <EventCard
                  key={termin.id}
                  termin={termin}
                  index={index}
                  isNext={termin.id === nextEvent?.id}
                  t={t}
                />
              ))}
            </div>
          </section>
        )}

        {/* Archive */}
        {years.map(year => {
          const pastForYear = (termineByYear[year] || []).filter(item => isVergangen(item.datum));
          if (pastForYear.length === 0) return null;
          return (
            <section key={year} className="mb-2">
              <button
                onClick={() => setShowArchive(showArchive === year ? null : year)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/30 border border-zinc-800/60 hover:border-zinc-700 rounded-xl text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-all"
              >
                <span className="w-1 h-3.5 bg-zinc-700 rounded-full shrink-0" />
                <span>{t.archive} {year}</span>
                <span className="text-xs text-zinc-700 ml-0.5">({pastForYear.length} {t.termineCount})</span>
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform duration-200 ${showArchive === year ? 'rotate-180' : ''}`}
                />
              </button>
              {showArchive === year && (
                <div className="mt-2 flex flex-col gap-1">
                  {pastForYear.map((termin, index) => (
                    <CompactCard key={termin.id} termin={termin} index={index} t={t} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <footer className="border-t border-zinc-900 py-8 text-center">
        <p className="text-zinc-600 text-sm">{termineData.meta.autor}</p>
        <p className="text-zinc-700 text-xs mt-1">
          Powered by{' '}
          <a href="https://kezar.at" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Kezar.at
          </a>
        </p>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
