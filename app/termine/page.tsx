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
      <div className="flex items-center justify-center gap-2 mb-3" style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b7280' }}>
        <Timer style={{ width: 13, height: 13, color: '#0d9488' }} />
        <span>{t.countdown}</span>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-7 tracking-tight" style={{ color: '#1e293b' }}>{eventName}</h3>
      <div className="flex justify-center gap-3 sm:gap-4">
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
  id: number; titel: string; datum: string; datumText: string;
  ort: string; zeit: string; beschreibung?: string; jahr: number;
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
      <p className="flex items-center justify-center gap-1.5 text-sm mb-2 font-medium" style={{ color: '#0891b2' }}>
        <Calendar style={{ width: 13, height: 13 }} />
        {termin.datumText}
      </p>
      <p className="text-xl sm:text-[1.35rem] font-bold mb-2.5 leading-snug tracking-tight" style={{ color: '#0f172a' }}>
        {termin.titel}
      </p>
      {termin.beschreibung && (
        <p className="text-sm italic mb-2.5" style={{ color: '#64748b' }}>{termin.beschreibung}</p>
      )}
      <div className="flex flex-col items-center gap-1 mt-1">
        {termin.ort && (
          <p className="flex items-center gap-1.5 text-sm" style={{ color: '#64748b' }}>
            <MapPin style={{ width: 13, height: 13, flexShrink: 0, color: '#0d9488' }} />
            {termin.ort}
          </p>
        )}
        {termin.zeit && (
          <p className="flex items-center gap-1.5 text-sm" style={{ color: '#94a3b8' }}>
            <Clock style={{ width: 13, height: 13, flexShrink: 0, color: '#0d9488' }} />
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
      <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: 2, fontWeight: 500 }}>{termin.datumText}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 min-w-0 text-sm font-medium" style={{ color: '#334155' }}>{termin.titel}</span>
        {termin.ort && <span className="text-xs shrink-0" style={{ color: '#94a3b8' }}>{termin.ort}</span>}
        {termin.zeit && (
          <span className="text-xs shrink-0" style={{ color: '#0d9488', opacity: 0.7 }}>{t.at} {termin.zeit} {t.oclock}</span>
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
          <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '2px solid #0d9488', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#94a3b8' }}>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!termineData) {
    return (
      <div className="min-h-screen termine-bg flex items-center justify-center">
        <p className="text-red-500 text-sm">{t.error}</p>
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
    <div className="min-h-screen termine-bg">
      <MyHeader />

      {/* Hero */}
      <header className="relative py-16 sm:py-20 px-4 text-center overflow-hidden">
        {/* Decorative blobs — very subtle */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="hero-blob-1" />
          <div className="hero-blob-2" />
        </div>

        <div className="relative z-10 max-w-xl mx-auto">
          <div className="hero-icon-wrap mb-6">
            <Music style={{ width: 32, height: 32, color: 'white' }} />
          </div>

          <h1 className="hero-title mb-2">
            {termineData.meta.titel}
          </h1>
          <p style={{ fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
            Termine 2022 — 2026
          </p>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: 36 }}>
            {termineData.meta.untertitel}
          </p>

          {/* Language Switcher */}
          <div className="flex justify-center">
            <div className="lang-switcher">
              {(['de', 'sl', 'la'] as Lang[]).map(l => (
                <button key={l} onClick={() => handleLangChange(l)}
                  className={`lang-btn ${lang === l ? 'lang-btn-active' : ''}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        {nextEvent && (
          <Countdown targetDate={nextEvent.datum} targetTime={nextEvent.zeit}
            eventName={nextEvent.titel} t={t} />
        )}

        {kommendeTermine.length > 0 && (
          <section className="mb-10">
            <h2 className="section-title">
              <span className="section-bar" />
              {t.upcoming}
              <span className="section-count">{kommendeTermine.length} {t.termineCount}</span>
            </h2>
            <div className="flex flex-col gap-4">
              {kommendeTermine.map((termin, index) => (
                <EventCard key={termin.id} termin={termin} index={index}
                  isNext={termin.id === nextEvent?.id} t={t} />
              ))}
            </div>
          </section>
        )}

        {years.map(year => {
          const pastForYear = (termineByYear[year] || []).filter(item => isVergangen(item.datum));
          if (pastForYear.length === 0) return null;
          return (
            <section key={year} className="mb-2">
              <button onClick={() => setShowArchive(showArchive === year ? null : year)}
                className="archive-btn">
                <span className="archive-bar" />
                <span style={{ color: '#64748b' }}>{t.archive} {year}</span>
                <span style={{ fontSize: 12, color: '#cbd5e1', marginLeft: 2 }}>({pastForYear.length} {t.termineCount})</span>
                <ChevronDown style={{ width: 15, height: 15, marginLeft: 'auto', color: '#94a3b8', transition: 'transform 0.3s', transform: showArchive === year ? 'rotate(180deg)' : 'none' }} />
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

      <footer style={{ borderTop: '1px solid rgba(13,148,136,0.1)', padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{termineData.meta.autor}</p>
        <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
          Powered by{' '}
          <a href="https://kezar.at" style={{ color: '#0d9488', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0891b2')}
            onMouseLeave={e => (e.currentTarget.style.color = '#0d9488')}>
            Kezar.at
          </a>
        </p>
      </footer>

      <style jsx global>{`

        /* ─── Page background: white → mint → teal → violet whisper ── */
        .termine-bg {
          background: linear-gradient(
            155deg,
            #ffffff        0%,
            #f4fefb       14%,
            #eafbf5       30%,
            #e6faf8       48%,
            #ecfdfc       63%,
            #f5f3ff       78%,
            #faf8ff       90%,
            #ffffff       100%
          );
          min-height: 100vh;
        }

        /* ─── Hero blobs ────────────────────────────────────── */
        .hero-blob-1 {
          position: absolute;
          top: -60px; left: 50%;
          transform: translateX(-40%);
          width: 500px; height: 260px;
          background: radial-gradient(ellipse, rgba(13,148,136,0.09) 0%, transparent 70%);
          border-radius: 50%;
        }
        .hero-blob-2 {
          position: absolute;
          bottom: -40px; right: 10%;
          width: 300px; height: 200px;
          background: radial-gradient(ellipse, rgba(8,145,178,0.06) 0%, transparent 70%);
          border-radius: 50%;
        }
        /* subtle violet glow — bottom-left corner */
        .hero-blob-2::after {
          content: '';
          position: fixed;
          bottom: 0; left: 0;
          width: 400px; height: 300px;
          background: radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        /* ─── Hero icon ─────────────────────────────────────── */
        .hero-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px; height: 64px;
          border-radius: 18px;
          background: linear-gradient(135deg, #0d9488 0%, #7c3aed 100%);
          box-shadow: 0 8px 28px rgba(13,148,136,0.22), 0 4px 16px rgba(124,58,237,0.18);
        }

        /* ─── Hero title ────────────────────────────────────── */
        .hero-title {
          font-size: clamp(2.4rem, 8vw, 3.8rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #0f172a 25%, #0d9488 65%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.08;
        }

        /* ─── Language switcher ─────────────────────────────── */
        .lang-switcher {
          display: inline-flex;
          gap: 2px;
          background: rgba(255,255,255,0.75);
          border: 1px solid rgba(13,148,136,0.15);
          border-radius: 999px;
          padding: 3px;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(13,148,136,0.08);
        }
        .lang-btn {
          padding: 6px 18px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #94a3b8;
          transition: all 0.22s ease;
          cursor: pointer;
          background: transparent;
          border: none;
        }
        .lang-btn:hover { color: #0d9488; }
        .lang-btn-active {
          background: linear-gradient(135deg, #0d9488, #7c3aed);
          color: white !important;
          box-shadow: 0 2px 10px rgba(124,58,237,0.2), 0 2px 8px rgba(13,148,136,0.2);
        }

        /* ─── Animated card border (@property) ─────────────── */
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
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(13,148,136,0.07), 0 1px 3px rgba(0,0,0,0.04);
        }
        .ms-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 2px;
          background: conic-gradient(
            from var(--ba),
            #0d9488,
            #06b6d4,
            #8b5cf6,
            #0891b2,
            #7c3aed,
            #34d399,
            #0d9488
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: border-spin 5s linear infinite;
          opacity: 0.45;
          transition: opacity 0.35s ease;
        }
        .ms-card:hover::before {
          opacity: 0.82;
          animation-duration: 2.2s;
        }
        .ms-card-countdown::before {
          animation-duration: 4s;
          opacity: 0.38;
        }

        /* ─── Countdown boxes ───────────────────────────────── */
        .countdown-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 70px; height: 82px;
          background: linear-gradient(160deg, rgba(13,148,136,0.06), rgba(8,145,178,0.04));
          border: 1px solid rgba(13,148,136,0.14);
          border-radius: 12px;
        }
        @media (min-width: 640px) {
          .countdown-box { width: 86px; height: 98px; }
        }
        .countdown-value {
          font-size: 1.8rem;
          font-weight: 900;
          font-family: ui-monospace, monospace;
          color: #0d9488;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        @media (min-width: 640px) {
          .countdown-value { font-size: 2.2rem; }
        }
        .countdown-label {
          font-size: 9px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-top: 5px;
        }

        /* ─── Next event badge ──────────────────────────────── */
        .next-badge {
          display: inline-block;
          padding: 3px 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0d9488;
          background: rgba(13,148,136,0.08);
          border: 1px solid rgba(13,148,136,0.22);
          border-radius: 999px;
        }

        /* ─── Section title ─────────────────────────────────── */
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #94a3b8;
          margin-bottom: 20px;
        }
        .section-bar {
          width: 3px; height: 16px;
          border-radius: 2px;
          background: linear-gradient(to bottom, #0d9488, #7c3aed);
          flex-shrink: 0;
        }
        .section-count {
          margin-left: auto;
          font-size: 11px;
          font-weight: 400;
          color: #cbd5e1;
          text-transform: none;
          letter-spacing: 0;
        }

        /* ─── Archive button ────────────────────────────────── */
        .archive-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(13,148,136,0.1);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.22s ease;
        }
        .archive-btn:hover {
          background: rgba(13,148,136,0.04);
          border-color: rgba(13,148,136,0.22);
        }
        .archive-bar {
          width: 3px; height: 13px;
          border-radius: 2px;
          background: rgba(13,148,136,0.2);
          flex-shrink: 0;
          transition: background 0.22s;
        }
        .archive-btn:hover .archive-bar { background: #0d9488; }

        /* ─── Compact card ──────────────────────────────────── */
        .compact-card {
          border-radius: 10px;
          border: 1px solid rgba(13,148,136,0.07);
          background: rgba(255,255,255,0.45);
          transition: background 0.2s, border-color 0.2s;
        }
        .compact-card:hover {
          background: rgba(255,255,255,0.8);
          border-color: rgba(13,148,136,0.18);
        }

        /* ─── Animations ────────────────────────────────────── */
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
