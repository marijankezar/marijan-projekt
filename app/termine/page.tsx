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

function Countdown({ targetDate, targetTime, eventName, t }: {
  targetDate: string; targetTime: string; eventName: string; t: T;
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const [h, m] = targetTime.split(':').map(Number);
      const target = new Date(targetDate);
      target.setHours(h || 19, m || 0, 0, 0);
      const diff = target.getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate, targetTime]);

  if (!mounted) return null;

  const units = [
    { value: timeLeft.days, label: t.days },
    { value: timeLeft.hours, label: t.hours },
    { value: timeLeft.minutes, label: t.min },
    { value: timeLeft.seconds, label: t.sec },
  ];

  return (
    <div className="ms-card ms-card-countdown mb-8 text-center p-6 sm:p-8">
      <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-3">
        <Timer className="w-3.5 h-3.5 text-[#4da6ff]" />
        <span>{t.countdown}</span>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-7 tracking-tight">{eventName}</h3>
      <div className="flex justify-center gap-3 sm:gap-5">
        {units.map((unit, i) => (
          <div key={i} className="countdown-box">
            <span className="countdown-value">{String(unit.value).padStart(2, '0')}</span>
            <span className="countdown-label">{unit.label}</span>
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
      className="ms-card p-6 text-center"
      style={{ opacity: 0, animation: `fadeInUp 0.5s cubic-bezier(0.23,1,0.32,1) ${index * 80}ms forwards` }}
    >
      {isNext && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-full pb-1">
          <span className="next-badge">{t.nextBadge}</span>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[#4da6ff]/70 text-sm mb-2 font-medium">
        <Calendar className="w-3.5 h-3.5" />
        {termin.datumText}
      </p>

      <p className="text-xl sm:text-[1.35rem] font-bold text-white mb-2.5 leading-snug tracking-tight">
        {termin.titel}
      </p>

      {termin.beschreibung && (
        <p className="text-sm text-slate-500 italic mb-2.5">{termin.beschreibung}</p>
      )}

      <div className="flex flex-col items-center gap-1 mt-1">
        {termin.ort && (
          <p className="flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#6264A7]" />
            {termin.ort}
          </p>
        )}
        {termin.zeit && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="w-3.5 h-3.5 shrink-0 text-[#6264A7]" />
            {t.at} {termin.zeit} {t.oclock}
          </p>
        )}
      </div>
    </div>
  );
}

function CompactCard({ termin, index, t }: { termin: Termin; index: number; t: T }) {
  return (
    <div
      className="compact-card px-4 py-3"
      style={{ opacity: 0, animation: `fadeIn 0.35s ease-out ${index * 35}ms forwards` }}
    >
      <p className="text-[11px] text-slate-600 mb-0.5 font-medium">{termin.datumText}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-300 flex-1 min-w-0">{termin.titel}</span>
        {termin.ort && <span className="text-xs text-slate-600">{termin.ort}</span>}
        {termin.zeit && (
          <span className="text-xs text-[#4da6ff]/50">{t.at} {termin.zeit} {t.oclock}</span>
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
      .then(r => r.json())
      .then(d => { setTermineData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const t = translations[lang];

  if (loading) {
    return (
      <div className="min-h-screen termine-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#0078D4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!termineData) {
    return (
      <div className="min-h-screen termine-bg flex items-center justify-center">
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
    <div className="min-h-screen termine-bg text-white">
      <MyHeader />

      {/* Hero */}
      <header className="relative py-16 sm:py-20 px-4 text-center overflow-hidden">
        {/* Subtle background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0078D4] opacity-[0.05] blur-[80px] rounded-full" />
          <div className="absolute top-0 right-1/4 w-[300px] h-[200px] bg-[#6264A7] opacity-[0.05] blur-[60px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-xl mx-auto">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 hero-icon">
            <Music className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-2 hero-title">
            {termineData.meta.titel}
          </h1>
          <p className="text-slate-600 text-[11px] uppercase tracking-[0.3em] mb-2">
            Termine 2022 — 2026
          </p>
          <p className="text-slate-500 text-sm mb-10">{termineData.meta.untertitel}</p>

          {/* Language Switcher */}
          <div className="flex justify-center">
            <div className="lang-switcher">
              {(['de', 'sl', 'la'] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className={`lang-btn ${lang === l ? 'lang-btn-active' : ''}`}
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
            <h2 className="section-title">
              <span className="section-bar" />
              {t.upcoming}
              <span className="section-count">{kommendeTermine.length} {t.termineCount}</span>
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
                className="archive-btn"
              >
                <span className="archive-bar" />
                <span className="text-slate-400">{t.archive} {year}</span>
                <span className="text-xs text-slate-700 ml-1">({pastForYear.length} {t.termineCount})</span>
                <ChevronDown
                  className={`w-4 h-4 ml-auto text-slate-600 transition-transform duration-300 ${showArchive === year ? 'rotate-180' : ''}`}
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

      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-slate-600 text-sm">{termineData.meta.autor}</p>
        <p className="text-slate-700 text-xs mt-1">
          Powered by{' '}
          <a href="https://kezar.at" className="text-slate-500 hover:text-[#4da6ff] transition-colors">
            Kezar.at
          </a>
        </p>
      </footer>

      <style jsx global>{`
        /* ─── Page background ─────────────────────────────── */
        .termine-bg {
          background:
            radial-gradient(ellipse 60% 40% at 50% -10%, rgba(0,120,212,0.08) 0%, transparent 100%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(98,100,167,0.06) 0%, transparent 100%),
            #06060e;
        }

        /* ─── Animated border via @property ──────────────── */
        @property --ba {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes border-spin {
          to { --ba: 360deg; }
        }

        .ms-card {
          position: relative;
          background: rgba(8, 14, 32, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-radius: 16px;
        }
        .ms-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 1.5px;
          background: conic-gradient(
            from var(--ba),
            #0078D4,
            #2563eb,
            #6264A7,
            #8764B8,
            #2899F5,
            #0078D4
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: border-spin 7s linear infinite;
          opacity: 0.28;
          transition: opacity 0.45s ease, animation-duration 0.45s;
        }
        .ms-card:hover::before {
          opacity: 0.75;
          animation-duration: 2.8s;
        }

        /* Countdown card — slightly different timing */
        .ms-card-countdown::before {
          animation-duration: 5s;
          opacity: 0.2;
        }

        /* ─── Countdown boxes ─────────────────────────────── */
        .countdown-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 80px;
          background: rgba(0, 120, 212, 0.06);
          border: 1px solid rgba(0, 120, 212, 0.15);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }
        .countdown-box::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,120,212,0.04) 0%, transparent 100%);
          pointer-events: none;
        }
        @media (min-width: 640px) {
          .countdown-box { width: 84px; height: 96px; }
        }
        .countdown-value {
          font-size: 1.75rem;
          font-weight: 900;
          font-family: ui-monospace, monospace;
          color: #4da6ff;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        @media (min-width: 640px) {
          .countdown-value { font-size: 2.25rem; }
        }
        .countdown-label {
          font-size: 9px;
          color: rgba(148, 163, 184, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-top: 5px;
        }

        /* ─── Hero icon ───────────────────────────────────── */
        .hero-icon {
          background: linear-gradient(135deg, #0078D4 0%, #6264A7 100%);
          box-shadow: 0 8px 32px rgba(0, 120, 212, 0.25);
        }

        /* ─── Hero title ──────────────────────────────────── */
        .hero-title {
          background: linear-gradient(135deg, #fff 50%, #7eb8ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ─── Language switcher ───────────────────────────── */
        .lang-switcher {
          display: flex;
          gap: 2px;
          background: rgba(8, 14, 32, 0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 999px;
          padding: 3px;
          backdrop-filter: blur(10px);
        }
        .lang-btn {
          padding: 6px 18px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(148,163,184,0.6);
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .lang-btn:hover { color: #cbd5e1; }
        .lang-btn-active {
          background: linear-gradient(135deg, #0078D4, #6264A7);
          color: white !important;
          box-shadow: 0 2px 12px rgba(0,120,212,0.35);
        }

        /* ─── Next event badge ────────────────────────────── */
        .next-badge {
          display: inline-block;
          padding: 3px 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #93c5fd;
          background: rgba(0, 120, 212, 0.12);
          border: 1px solid rgba(0, 120, 212, 0.3);
          border-radius: 999px;
          backdrop-filter: blur(8px);
        }

        /* ─── Section title ───────────────────────────────── */
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(148,163,184,0.7);
          margin-bottom: 20px;
        }
        .section-bar {
          width: 3px;
          height: 16px;
          border-radius: 2px;
          background: linear-gradient(to bottom, #0078D4, #6264A7);
          flex-shrink: 0;
        }
        .section-count {
          margin-left: auto;
          font-size: 11px;
          font-weight: 400;
          color: rgba(100,116,139,0.5);
          text-transform: none;
          letter-spacing: 0;
        }

        /* ─── Archive button ──────────────────────────────── */
        .archive-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          background: rgba(8,14,32,0.4);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .archive-btn:hover {
          background: rgba(0, 120, 212, 0.06);
          border-color: rgba(0, 120, 212, 0.2);
        }
        .archive-bar {
          width: 3px;
          height: 13px;
          border-radius: 2px;
          background: rgba(98,100,167,0.4);
          flex-shrink: 0;
          transition: background 0.25s;
        }
        .archive-btn:hover .archive-bar {
          background: #6264A7;
        }

        /* ─── Compact card ────────────────────────────────── */
        .compact-card {
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.04);
          background: rgba(8,14,32,0.3);
          transition: background 0.2s, border-color 0.2s;
        }
        .compact-card:hover {
          background: rgba(0,120,212,0.04);
          border-color: rgba(0,120,212,0.12);
        }

        /* ─── Animations ──────────────────────────────────── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
