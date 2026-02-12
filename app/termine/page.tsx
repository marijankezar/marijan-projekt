'use client';

import { Music, Sparkles, ChevronDown, MapPin, Clock, Calendar, Gem, Zap, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import MyHeader from '../components/header';

// Countdown Component
function Countdown({ targetDate, targetTime, eventName }: { targetDate: string; targetTime: string; eventName: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateTime = () => {
      const [hours, minutes] = targetTime.split(':').map(Number);
      const target = new Date(targetDate);
      target.setHours(hours || 19, minutes || 0, 0, 0);

      const now = new Date().getTime();
      const difference = target.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  if (!mounted) return null;

  const timeUnits = [
    { value: timeLeft.days, label: 'DNI', labelSingle: 'DAN' },
    { value: timeLeft.hours, label: 'UR', labelSingle: 'URA' },
    { value: timeLeft.minutes, label: 'MIN', labelSingle: 'MIN' },
    { value: timeLeft.seconds, label: 'SEK', labelSingle: 'SEK' },
  ];

  return (
    <div className="countdown-container">
      <div className="countdown-glow" />
      <div className="countdown-border" />
      <div className="countdown-content">
        <div className="countdown-header">
          <Timer className="w-5 h-5 text-cyan-400" />
          <span>Odštevalnik do naslednjega eventa</span>
          <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
        </div>

        <h3 className="countdown-event-name">{eventName}</h3>

        <div className="countdown-boxes">
          {timeUnits.map((unit, i) => (
            <div key={i} className="countdown-box">
              <div className="countdown-value">
                {String(unit.value).padStart(2, '0')}
              </div>
              <div className="countdown-label">
                {unit.value === 1 ? unit.labelSingle : unit.label}
              </div>
            </div>
          ))}
        </div>
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
  meta: {
    titel: string;
    untertitel: string;
    autor: string;
  };
  termine: Termin[];
}

// Animated Border Card
function AnimatedBorderCard({ termin, index, isNext }: { termin: Termin; index: number; isNext: boolean }) {
  return (
    <div
      className="animated-card group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Rotating gradient border */}
      <div className="card-glow" />
      <div className="card-border" />

      {/* Content */}
      <div className="card-content">
        {isNext && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 text-white rounded-full shadow-lg animate-pulse">
              Naslednji Event
            </span>
          </div>
        )}

        <p className="datum-text">
          <Calendar className="inline w-5 h-5 mr-2 opacity-70" />
          {termin.datumText}
        </p>

        <p className="titel-text">
          {termin.titel}
        </p>

        {termin.beschreibung && (
          <p className="beschreibung-text">
            {termin.beschreibung}
          </p>
        )}

        {termin.ort && (
          <p className="ort-text">
            <MapPin className="inline w-4 h-4 mr-1" />
            {termin.ort}
          </p>
        )}

        {termin.zeit && (
          <p className="zeit-text">
            <Clock className="inline w-4 h-4 mr-1" />
            ob {termin.zeit} uri
          </p>
        )}
      </div>
    </div>
  );
}

// Compact card for past events
function CompactCard({ termin, index }: { termin: Termin; index: number }) {
  return (
    <div
      className="compact-card group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="compact-glow" />
      <div className="compact-border" />
      <div className="compact-content">
        <span className="compact-datum">{termin.datumText}</span>
        <span className="compact-titel">{termin.titel}</span>
        {termin.ort && <span className="compact-ort">{termin.ort}</span>}
        {termin.zeit && <span className="compact-zeit">ob {termin.zeit}</span>}
      </div>
    </div>
  );
}

export default function TerminePage() {
  const [termineData, setTermineData] = useState<TermineData | null>(null);
  const [showArchive, setShowArchive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/termine.json')
      .then(res => res.json())
      .then(data => {
        setTermineData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading termine:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 animate-pulse">Nalaganje terminov...</p>
        </div>
      </div>
    );
  }

  if (!termineData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-400">Napaka pri nalaganju terminov</p>
      </div>
    );
  }

  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const isVergangen = (datum: string) => new Date(datum) < heute;

  // Group by year
  const years = [2026, 2025, 2024, 2023, 2022];
  const termineByYear: Record<number, Termin[]> = {};

  years.forEach(year => {
    termineByYear[year] = termineData.termine
      .filter(t => t.jahr === year)
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
  });

  const kommendeTermine = termineData.termine
    .filter(t => !isVergangen(t.datum))
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
  const nextEvent = kommendeTermine[0];

  return (
    <div className="termine-page">
      <MyHeader />

      {/* Hero */}
      <header className="hero-section">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-icon">
            <Music className="w-12 h-12 text-white" />
            <Sparkles className="sparkle-icon" />
          </div>
          <h1 className="hero-title">{termineData.meta.titel}</h1>
          <h2 className="hero-subtitle">Termini 2022 — 2026</h2>
          <p className="hero-tagline">
            <Gem className="inline w-4 h-4" />
            <span>{termineData.meta.untertitel}</span>
            <Gem className="inline w-4 h-4" />
          </p>
        </div>
      </header>

      <main className="main-content">
        {/* Countdown zum nächsten Event */}
        {nextEvent && (
          <Countdown
            targetDate={nextEvent.datum}
            targetTime={nextEvent.zeit}
            eventName={nextEvent.titel}
          />
        )}

        {/* Kommende Termine 2025 */}
        {kommendeTermine.length > 0 && (
          <section className="termine-section">
            <h2 className="section-title">
              <span className="title-bar from-cyan-400 to-purple-500" />
              Prihajajoči Termini
            </h2>
            <div className="termine-grid">
              {kommendeTermine.map((termin, index) => (
                <AnimatedBorderCard
                  key={termin.id}
                  termin={termin}
                  index={index}
                  isNext={termin.id === nextEvent?.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* Archive Years */}
        {years.map(year => {
          const pastEventsForYear = (termineByYear[year] || []).filter(t => isVergangen(t.datum));
          if (pastEventsForYear.length === 0) return null;
          return (
            <section key={year} className="termine-section">
              <button
                onClick={() => setShowArchive(showArchive === year ? null : year)}
                className="archive-button"
              >
                <span className="title-bar from-gray-600 to-gray-700" />
                <span>Arhiv {year} ({pastEventsForYear.length} terminov)</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${showArchive === year ? 'rotate-180' : ''}`} />
              </button>
              {showArchive === year && (
                <div className="compact-grid mt-4">
                  {pastEventsForYear.map((termin, index) => (
                    <CompactCard key={termin.id} termin={termin} index={index} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-gems">
          {[...Array(5)].map((_, i) => (
            <Gem key={i} className="w-5 h-5 text-cyan-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
        <p className="footer-author">{termineData.meta.autor}</p>
        <p className="footer-powered">
          Powered by <a href="https://kezar.at" className="footer-link">Kezar.at</a>
        </p>
      </footer>

      <style jsx global>{`
        .termine-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%);
          color: white;
        }

        /* Hero */
        .hero-section {
          position: relative;
          min-height: 45vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
        }
        .hero-content { position: relative; text-align: center; z-index: 10; }
        .hero-icon {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #06b6d4, #a855f7);
          border-radius: 1rem;
          margin-bottom: 1.5rem;
          animation: float 3s ease-in-out infinite;
        }
        .sparkle-icon {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          color: #fbbf24;
          animation: sparkle 1.5s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
        }
        .hero-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 900;
          background: linear-gradient(135deg, #fff, #06b6d4, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-transform: uppercase;
        }
        .hero-subtitle {
          font-size: clamp(1rem, 3vw, 1.5rem);
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        .hero-tagline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: #06b6d4;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }

        /* Countdown */
        .countdown-container {
          position: relative;
          border-radius: 1.5rem;
          margin-bottom: 3rem;
        }
        .countdown-glow {
          position: absolute;
          inset: -3px;
          border-radius: 1.5rem;
          background: conic-gradient(from 0deg, #06b6d4, #a855f7, #ec4899, #fbbf24, #06b6d4);
          filter: blur(20px);
          opacity: 0.4;
          animation: subtlePulse 4s ease-in-out infinite;
          z-index: 0;
        }
        .countdown-border {
          position: absolute;
          inset: 0;
          border-radius: 1.5rem;
          padding: 3px;
          background: conic-gradient(from 0deg, #06b6d4, #a855f7, #ec4899, #fbbf24, #06b6d4);
          z-index: 1;
        }
        .countdown-border::before {
          content: '';
          position: absolute;
          inset: 3px;
          background: linear-gradient(135deg, #0a0a0a, #151515);
          border-radius: calc(1.5rem - 3px);
        }
        .countdown-content {
          position: relative;
          z-index: 2;
          padding: 2rem;
          margin: 3px;
          background: linear-gradient(135deg, rgba(10, 10, 10, 0.98), rgba(20, 20, 20, 0.98));
          border-radius: calc(1.5rem - 3px);
          text-align: center;
        }
        .countdown-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
        }
        .countdown-event-name {
          font-size: clamp(1.2rem, 4vw, 1.8rem);
          font-weight: 800;
          background: linear-gradient(135deg, #fff, #06b6d4, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
        }
        .countdown-boxes {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
        }
        .countdown-box {
          position: relative;
          width: 70px;
          height: 85px;
          background: linear-gradient(135deg, #1a1a1a, #0d0d0d);
          border-radius: 0.75rem;
          border: 1px solid #333;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .countdown-box::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #333, transparent);
        }
        .countdown-value {
          font-size: 2rem;
          font-weight: 900;
          font-family: monospace;
          background: linear-gradient(180deg, #fff, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }
        .countdown-label {
          font-size: 0.65rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.25rem;
        }
        @media (min-width: 640px) {
          .countdown-box {
            width: 90px;
            height: 100px;
          }
          .countdown-value {
            font-size: 2.5rem;
          }
          .countdown-label {
            font-size: 0.75rem;
          }
          .countdown-boxes {
            gap: 1rem;
          }
        }

        /* Main */
        .main-content { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
        .termine-section { margin-bottom: 2rem; }
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .title-bar {
          width: 4px;
          height: 1.75rem;
          border-radius: 2px;
          background: linear-gradient(to bottom, var(--tw-gradient-from), var(--tw-gradient-to));
        }
        .termine-grid { display: flex; flex-direction: column; gap: 1.25rem; }

        /* Animated Card with WORKING rotating border */
        .animated-card {
          position: relative;
          border-radius: 1rem;
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* The glow behind */
        .card-glow {
          position: absolute;
          inset: -2px;
          border-radius: 1rem;
          background: conic-gradient(from 0deg, #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080);
          filter: blur(15px);
          opacity: 0.3;
          transition: opacity 0.6s ease, filter 0.6s ease;
          z-index: 0;
        }

        /* The visible border */
        .card-border {
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          padding: 3px;
          background: conic-gradient(from 0deg, #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080);
          opacity: 0.7;
          transition: opacity 0.6s ease;
          z-index: 1;
        }
        .card-border::before {
          content: '';
          position: absolute;
          inset: 3px;
          background: #111;
          border-radius: calc(1rem - 3px);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes subtlePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }

        .animated-card:hover .card-glow {
          opacity: 0.55;
          filter: blur(20px);
        }
        .animated-card:hover .card-border {
          opacity: 1;
        }

        .card-content {
          position: relative;
          background: rgba(17, 17, 17, 0.98);
          border-radius: calc(1rem - 3px);
          padding: 1.5rem;
          text-align: center;
          z-index: 2;
          margin: 3px;
        }

        .datum-text { font-size: 1rem; color: #06b6d4; margin-bottom: 0.5rem; }
        .titel-text {
          font-size: clamp(1.2rem, 4vw, 1.6rem);
          font-weight: 800;
          background: linear-gradient(135deg, #fff, #f0abfc, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .beschreibung-text { font-size: 0.9rem; color: #a78bfa; margin-bottom: 0.5rem; font-style: italic; }
        .ort-text { font-size: 0.9rem; color: #34d399; margin-bottom: 0.25rem; }
        .zeit-text { font-size: 0.9rem; color: #fbbf24; }

        /* Compact Cards */
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.75rem;
        }
        .compact-card {
          position: relative;
          border-radius: 0.75rem;
          opacity: 0;
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn { to { opacity: 1; } }

        .compact-glow {
          position: absolute;
          inset: -1px;
          border-radius: 0.75rem;
          background: conic-gradient(from 0deg, #06b6d4, #a855f7, #ec4899, #06b6d4);
          filter: blur(8px);
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 0;
        }
        .compact-border {
          position: absolute;
          inset: 0;
          border-radius: 0.75rem;
          padding: 2px;
          background: linear-gradient(135deg, #333, #222);
          transition: background 0.3s;
          z-index: 1;
        }
        .compact-border::before {
          content: '';
          position: absolute;
          inset: 2px;
          background: #111;
          border-radius: calc(0.75rem - 2px);
        }
        .compact-card:hover .compact-glow {
          opacity: 0.4;
        }
        .compact-card:hover .compact-border {
          background: linear-gradient(135deg, #06b6d4, #a855f7, #ec4899, #06b6d4);
        }

        .compact-content {
          position: relative;
          background: rgba(17, 17, 17, 0.95);
          border-radius: calc(0.75rem - 2px);
          padding: 0.875rem;
          margin: 2px;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
          z-index: 2;
        }
        .compact-datum { font-size: 0.75rem; color: #9ca3af; width: 100%; }
        .compact-titel { font-size: 0.95rem; font-weight: 600; color: white; flex: 1; }
        .compact-ort { font-size: 0.7rem; color: #6b7280; }
        .compact-zeit { font-size: 0.7rem; color: #06b6d4; }

        /* Archive Button */
        .archive-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: rgba(25, 25, 25, 0.8);
          border: 1px solid #333;
          border-radius: 0.75rem;
          color: #9ca3af;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .archive-button:hover {
          background: rgba(35, 35, 35, 0.9);
          border-color: #06b6d4;
          color: white;
        }

        /* Footer */
        .footer-section {
          text-align: center;
          padding: 2.5rem 1rem;
          border-top: 1px solid #222;
        }
        .footer-gems { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; }
        .footer-author { font-size: 0.95rem; color: #9ca3af; margin-bottom: 0.25rem; }
        .footer-powered { font-size: 0.8rem; color: #6b7280; }
        .footer-link { color: #06b6d4; text-decoration: underline; }
        .footer-link:hover { color: #22d3ee; }

        @media (max-width: 640px) {
          .card-content { padding: 1.25rem; }
          .compact-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
