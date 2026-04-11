"use client";

import { useEffect, useRef } from "react";
import { getNtpNow } from "./ntp";

// ── Koordinatensystem: 500×500, Mittelpunkt 250/250 ───────────────────────────
const SZ = 500, CX = 250, CY = 250;

function deg2rad(d: number)  { return d * Math.PI / 180; }
function f(n: number)        { return Math.round(n * 1000) / 1000; }

function pos(angleDeg: number, r: number): [number, number] {
  const a = deg2rad(angleDeg - 90);
  return [f(CX + r * Math.cos(a)), f(CY + r * Math.sin(a))];
}

// Schwertförmige Zeigerfläche (Polygon), ausgerichtet auf 12 Uhr
function handPoly(length: number, tail: number, w1: number, w2: number): string {
  const x = CX, y = CY;
  return [
    `${x},${y - length}`,
    `${x + w2},${y - length + 10}`,
    `${x + w1},${y - 22}`,
    `${x + w1 * 0.65},${y + tail}`,
    `${x},${y + tail + 5}`,
    `${x - w1 * 0.65},${y + tail}`,
    `${x - w1},${y - 22}`,
    `${x - w2},${y - length + 10}`,
  ].join(" ");
}

// Tachymeter: [Geschwindigkeit km/h, Winkel von 12 Uhr]
const TACHY: [number, number][] = [
  [500, 43], [400, 54], [300, 72], [240, 90],
  [200, 108], [150, 144], [120, 180], [100, 216],
  [90, 240], [80, 270], [75, 288], [70, 309],
];

interface AnalogClockProps {
  /** Optional: wird einmal pro Sekunde mit h/m/s aufgerufen */
  onTick?: (h: number, m: number, s: number) => void;
}

/**
 * Kežar Luxury Timepiece — analoge SVG-Uhr
 *
 * Animation: requestAnimationFrame für butterweiche Zeigerbewegung.
 * Zeitquelle: optionaler NTP-Offset (fetch → stiller Fallback auf Systemuhr).
 * Kein React-Re-Render während der Animation — alle Updates via DOM-Refs.
 */
export default function AnalogClock({ onTick }: AnalogClockProps) {
  const hrRef      = useRef<SVGGElement>(null);
  const mnRef      = useRef<SVGGElement>(null);
  const scRef      = useRef<SVGGElement>(null);
  const dateRef    = useRef<SVGTextElement>(null);
  const rafRef     = useRef<number>(0);
  const lastSecRef = useRef(-1);
  const onTickRef  = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    // prefers-reduced-motion: Zeiger auf aktuelle Position setzen, dann stoppen
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Gecachte Winkel — DOM nur updaten wenn Wert sich geändert hat
    let lastHrDeg = -1, lastMnDeg = -1, lastScDeg = -1;

    function updateHands() {
      const now    = new Date(getNtpNow());
      const ms     = now.getMilliseconds();
      const secInt = now.getSeconds();              // ganzzahlig 0-59 — kein Sub-Sekunden-Anteil
      const sFull  = secInt + ms / 1000;           // nur für Stunden-/Minutenzeiger (weiche Interpolation)
      const m      = now.getMinutes() + sFull / 60;
      const h      = (now.getHours() % 12) + m / 60;

      // CSS-Transforms → GPU-Compositor-Thread, kein Main-Thread-Reflow
      const hrDeg = f(h * 30);
      const mnDeg = f(m * 6);
      const scDeg = secInt * 6;                    // exakt: 0, 6, 12, … 354 — kein Dezimalanteil
      if (hrDeg !== lastHrDeg) { if (hrRef.current) hrRef.current.style.transform = `rotate(${hrDeg}deg)`; lastHrDeg = hrDeg; }
      if (mnDeg !== lastMnDeg) { if (mnRef.current) mnRef.current.style.transform = `rotate(${mnDeg}deg)`; lastMnDeg = mnDeg; }
      if (scDeg !== lastScDeg) { if (scRef.current) scRef.current.style.transform = `rotate(${scDeg}deg)`; lastScDeg = scDeg; }

      // Datum aktualisieren (ändert sich höchstens einmal täglich)
      const d = String(now.getDate());
      if (dateRef.current && dateRef.current.textContent !== d) {
        dateRef.current.textContent = d;
      }

      // onTick einmal pro Sekunde
      if (secInt !== lastSecRef.current) {
        lastSecRef.current = secInt;
        onTickRef.current?.(now.getHours(), now.getMinutes(), secInt);
      }
    }

    function loop() {
      // RAF pausieren wenn Tab nicht sichtbar → spart 60+ JS-Calls/Sek.
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      updateHands();
      rafRef.current = requestAnimationFrame(loop);
    }

    // Bei prefers-reduced-motion: einmal setzen, dann per Sekunden-Timer aktualisieren
    if (prefersReducedMotion) {
      updateHands();
      const staticTimer = setInterval(updateHands, 1000);
      return () => clearInterval(staticTimer);
    }

    // Beim Zurückkehren sofort resynchronisieren
    function onVisible() {
      if (!document.hidden) {
        lastHrDeg = lastMnDeg = lastScDeg = -1; // Cache leeren → sofortiges Update
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <>
      {/* ── Marken-Header ───────────────────────────────────────────────────── */}
      <div className="mb-7 text-center select-none relative z-10" aria-hidden="true">
        <p className="text-[9px] tracking-[0.65em] uppercase text-gray-500 font-light mb-2">
          Precision Timepiece · Since 1981
        </p>
        <p
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.55em" }}
          className="text-[1.35rem] uppercase font-normal text-gray-300"
        >
          Kežar
        </p>
      </div>

      {/* ── Uhr SVG ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex justify-center">
        <svg
          viewBox={`0 0 ${SZ} ${SZ}`}
          className="w-full max-w-[460px]"
          role="img"
          aria-label="Kežar Analoguhr — zeigt die aktuelle Uhrzeit in Europe/Vienna"
          style={{
            filter:
              "drop-shadow(0 30px 80px rgba(0,0,0,0.98)) drop-shadow(0 0 40px rgba(90,65,25,0.08))",
          }}
        >
          <title>Kežar Analoguhr</title>
          <desc>Analoge Luxusuhr, Kežar Chrono 6000, zeigt die aktuelle Uhrzeit in der Zeitzone Europe/Vienna mit Stunden-, Minuten- und Sekundenzeiger sowie Datumsfenster.</desc>
          <defs>
            {/* Stahlgehäuse */}
            <linearGradient id="caseGrad" x1="10%" y1="5%" x2="90%" y2="95%">
              <stop offset="0%"   stopColor="#f0f0f0"/>
              <stop offset="18%"  stopColor="#bdbdbd"/>
              <stop offset="38%"  stopColor="#e8e8e8"/>
              <stop offset="58%"  stopColor="#a8a8a8"/>
              <stop offset="80%"  stopColor="#d2d2d2"/>
              <stop offset="100%" stopColor="#888"/>
            </linearGradient>
            {/* Dunkle Lünette */}
            <linearGradient id="bezelGrad" x1="10%" y1="5%" x2="90%" y2="95%">
              <stop offset="0%"   stopColor="#383838"/>
              <stop offset="45%"  stopColor="#181818"/>
              <stop offset="100%" stopColor="#2c2c2c"/>
            </linearGradient>
            {/* Zifferblatt — sehr dunkel, leicht blau-schwarz */}
            <radialGradient id="dialGrad" cx="38%" cy="32%" r="72%">
              <stop offset="0%"   stopColor="#1d1d1d"/>
              <stop offset="60%"  stopColor="#0d0d0d"/>
              <stop offset="100%" stopColor="#060606"/>
            </radialGradient>
            {/* Stundenzeiger — polierter Stahl */}
            <linearGradient id="hrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#282828"/>
              <stop offset="18%"  stopColor="#b5b5b5"/>
              <stop offset="50%"  stopColor="#ececec"/>
              <stop offset="82%"  stopColor="#b5b5b5"/>
              <stop offset="100%" stopColor="#282828"/>
            </linearGradient>
            {/* Minutenzeiger */}
            <linearGradient id="minGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#1e1e1e"/>
              <stop offset="20%"  stopColor="#9e9e9e"/>
              <stop offset="50%"  stopColor="#d8d8d8"/>
              <stop offset="80%"  stopColor="#9e9e9e"/>
              <stop offset="100%" stopColor="#1e1e1e"/>
            </linearGradient>
            {/* Leuchtmasse-Streifen */}
            <linearGradient id="lumiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#a0ffcc" stopOpacity="0"/>
              <stop offset="28%"  stopColor="#a0ffcc" stopOpacity="0.42"/>
              <stop offset="72%"  stopColor="#a0ffcc" stopOpacity="0.42"/>
              <stop offset="100%" stopColor="#a0ffcc" stopOpacity="0"/>
            </linearGradient>
            {/* Stundenindizes */}
            <linearGradient id="idxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#ffffff"/>
              <stop offset="45%"  stopColor="#d5d5d5"/>
              <stop offset="100%" stopColor="#808080"/>
            </linearGradient>
            {/* Zentrumsknopf */}
            <radialGradient id="capGrad" cx="30%" cy="25%" r="65%">
              <stop offset="0%"   stopColor="#e8e8e8"/>
              <stop offset="50%"  stopColor="#888"/>
              <stop offset="100%" stopColor="#222"/>
            </radialGradient>
            {/* Sekundenzeiger-Glühen */}
            <filter id="secGlow">
              <feGaussianBlur stdDeviation="1.8" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Zeigerschatten */}
            <filter id="handShadow" x="-30%" y="-10%" width="160%" height="120%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6"/>
            </filter>
          </defs>

          {/* ── STAHLGEHÄUSE ── */}
          <circle cx={CX} cy={CY} r={245} fill="url(#caseGrad)"/>
          <circle cx={CX} cy={CY} r={244} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8"/>
          <circle cx={CX} cy={CY} r={237} fill="none" stroke="rgba(0,0,0,0.55)"       strokeWidth="2.5"/>

          {/* Gehäuse-Brushing — alternierende Segmente */}
          {Array.from({ length: 24 }, (_, i) => {
            const a1 = deg2rad(i * 15 - 90);
            const a2 = deg2rad(i * 15 + 7 - 90);
            const r1 = 237, r2 = 244;
            return (
              <path key={i}
                d={`M ${f(CX+r1*Math.cos(a1))} ${f(CY+r1*Math.sin(a1))} A ${r1} ${r1} 0 0 1 ${f(CX+r1*Math.cos(a2))} ${f(CY+r1*Math.sin(a2))} L ${f(CX+r2*Math.cos(a2))} ${f(CY+r2*Math.sin(a2))} A ${r2} ${r2} 0 0 0 ${f(CX+r2*Math.cos(a1))} ${f(CY+r2*Math.sin(a1))} Z`}
                fill={i % 2 === 0 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.04)"}
              />
            );
          })}

          {/* ── TACHYMETER-LÜNETTE ── */}
          <circle cx={CX} cy={CY} r={234} fill="url(#bezelGrad)"/>
          <circle cx={CX} cy={CY} r={234} fill="none" stroke="#484848" strokeWidth="0.6"/>
          <circle cx={CX} cy={CY} r={205} fill="none" stroke="#111"    strokeWidth="2.5"/>

          {/* Tachymeter-Striche */}
          {Array.from({ length: 61 }, (_, i) => {
            const a = i * 6;
            if (a < 40 || a > 360) return null;
            const [ox, oy] = pos(a, 231);
            const isMajor  = i % 5 === 0;
            const [ix, iy] = pos(a, isMajor ? 216 : 224);
            return (
              <line key={i} x1={ox} y1={oy} x2={ix} y2={iy}
                stroke={isMajor ? "#777" : "#444"}
                strokeWidth={isMajor ? 1.3 : 0.7}/>
            );
          })}

          {/* Tachymeter-Zahlen */}
          {TACHY.map(([v, a]) => {
            const [x, y] = pos(a, 211);
            return (
              <text key={v} x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fontSize="8.5" fontFamily="Arial, Helvetica, sans-serif"
                fontWeight="400" fill="#797979"
                transform={`rotate(${a}, ${x}, ${y})`}>
                {v}
              </text>
            );
          })}

          {/* TACHYMÈTRE-Beschriftung bei 12 Uhr */}
          <text x={CX} y={CY - 220} textAnchor="middle" dominantBaseline="central"
            fontSize="7.5" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="600" fill="#666" letterSpacing="3">
            TACHYMÈTRE
          </text>

          {/* ── ZIFFERBLATT ── */}
          <circle cx={CX} cy={CY} r={203} fill="url(#dialGrad)"/>

          {/* Sonnenschliff-Textur (sehr feine Radiallinien) */}
          {Array.from({ length: 72 }, (_, i) => {
            const a = deg2rad(i * 5 - 90);
            return (
              <line key={i}
                x1={f(CX + 5   * Math.cos(a))} y1={f(CY + 5   * Math.sin(a))}
                x2={f(CX + 201 * Math.cos(a))} y2={f(CY + 201 * Math.sin(a))}
                stroke="rgba(255,255,255,0.014)" strokeWidth="0.5"/>
            );
          })}

          {/* Chapter-Ring */}
          <circle cx={CX} cy={CY} r={201} fill="none" stroke="#2a2a2a" strokeWidth="3.5"/>
          <circle cx={CX} cy={CY} r={199} fill="none" stroke="#383838" strokeWidth="0.5"/>

          {/* Minuten-Striche (keine bei Stundenindizes) */}
          {Array.from({ length: 60 }, (_, i) => {
            if (i % 5 === 0) return null;
            const [ox, oy] = pos(i * 6, 195);
            const [ix, iy] = pos(i * 6, 187);
            return (
              <line key={i} x1={ox} y1={oy} x2={ix} y2={iy}
                stroke="#464646" strokeWidth="1" strokeLinecap="round"/>
            );
          })}

          {/* Aufgesetzte Stundenindizes (3 Uhr = Datumsfenster) */}
          {Array.from({ length: 12 }, (_, i) => {
            if (i === 3) return null;
            const angle  = i * 30;
            const isMain = i % 3 === 0;
            const outer  = 195, inner = isMain ? 168 : 178;
            const mid    = (outer + inner) / 2;
            const [mx, my] = pos(angle, mid);
            const len    = outer - inner;
            const w      = isMain ? 8.5 : 5.5;
            return (
              <g key={i}>
                {/* Schatten */}
                <rect x={mx - w/2 + 1} y={my - len/2 + 1} width={w} height={len} rx={1.2}
                  fill="rgba(0,0,0,0.6)"
                  transform={`rotate(${angle}, ${mx+1}, ${my+1})`}/>
                {/* Index */}
                <rect x={mx - w/2} y={my - len/2} width={w} height={len} rx={1.2}
                  fill="url(#idxGrad)"
                  transform={`rotate(${angle}, ${mx}, ${my})`}/>
              </g>
            );
          })}

          {/* ── BRANDING ── */}
          <text x={CX} y={CY - 84} textAnchor="middle" dominantBaseline="central"
            fontSize="14" fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="normal" fill="#cccccc" letterSpacing="6">
            KEŽAR
          </text>
          <text x={CX} y={CY - 65} textAnchor="middle" dominantBaseline="central"
            fontSize="8.5" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="300" fill="#6e6e6e" letterSpacing="5">
            CHRONO
          </text>
          <line x1={CX - 28} y1={CY - 55} x2={CX + 28} y2={CY - 55}
            stroke="#2a2a2a" strokeWidth="0.8"/>
          {/* Modell-Referenz */}
          <text x={CX} y={CY + 60} textAnchor="middle" dominantBaseline="central"
            fontSize="7.5" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="400" fill="#4a4a4a" letterSpacing="3">
            6000
          </text>
          <text x={CX} y={CY + 76} textAnchor="middle" dominantBaseline="central"
            fontSize="7.5" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="300" fill="#4e4e4e" letterSpacing="2.5">
            Automatic
          </text>
          <text x={CX} y={CY + 156} textAnchor="middle" dominantBaseline="central"
            fontSize="7" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="500" fill="#404040" letterSpacing="3">
            MADE IN AUSTRIA
          </text>

          {/* ── DATUMSFENSTER bei 3 Uhr ── */}
          <rect x={382} y={239} width={26} height={22} rx={2.5}
            fill="#333" stroke="#222" strokeWidth="1"/>
          <rect x={383} y={240} width={24} height={20} rx={2}
            fill="#f0f0f0"/>
          <line x1={395} y1={240} x2={395} y2={260}
            stroke="#d8d8d8" strokeWidth="0.7"/>
          <text ref={dateRef} x={395} y={250.5} textAnchor="middle" dominantBaseline="central"
            fontSize="11" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700" fill="#111">
            —
          </text>

          {/* ── ZEIGER ── */}

          {/* Stundenzeiger — transformOrigin = Zifferblatt-Mittelpunkt im SVG-Koordinatenraum */}
          <g ref={hrRef} filter="url(#handShadow)"
            style={{ transformOrigin: `${CX}px ${CY}px`, willChange: "transform" }}>
            <polygon points={handPoly(112, 26, 7.5, 3)} fill="url(#hrGrad)"/>
            <rect x={CX - 2} y={CY - 109} width={4} height={90} rx={1.5} fill="url(#lumiGrad)"/>
          </g>

          {/* Minutenzeiger */}
          <g ref={mnRef} filter="url(#handShadow)"
            style={{ transformOrigin: `${CX}px ${CY}px`, willChange: "transform" }}>
            <polygon points={handPoly(158, 33, 5.5, 2)} fill="url(#minGrad)"/>
            <rect x={CX - 1.5} y={CY - 155} width={3} height={132} rx={1} fill="url(#lumiGrad)"/>
          </g>

          {/* Sekundenzeiger */}
          <g ref={scRef} filter="url(#secGlow)"
            style={{ transformOrigin: `${CX}px ${CY}px`, willChange: "transform" }}>
            {/* Gegengewicht (Lollipop) */}
            <ellipse cx={CX} cy={CY + 44} rx={8.5} ry={12} fill="#c8001a"/>
            <ellipse cx={CX} cy={CY + 44} rx={4}   ry={6}  fill="#ff1133" opacity="0.65"/>
            {/* Schaft */}
            <line x1={CX} y1={CY + 58} x2={CX} y2={CY - 176}
              stroke="#c8001a" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Spitze */}
            <line x1={CX} y1={CY - 158} x2={CX} y2={CY - 176}
              stroke="#ff2244" strokeWidth="2.8" strokeLinecap="round"/>
          </g>

          {/* ── ZENTRUMSKNOPF ── */}
          <circle cx={CX} cy={CY} r={11}   fill="url(#capGrad)"/>
          <circle cx={CX} cy={CY} r={10.5} fill="none" stroke="#181818" strokeWidth="1.2"/>
          <circle cx={CX} cy={CY} r={4}    fill="#c8c8c8"/>
          <circle cx={CX} cy={CY} r={1.8}  fill="#888"/>
        </svg>
      </div>
    </>
  );
}
