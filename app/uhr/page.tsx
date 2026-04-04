"use client";

import { useEffect, useState, useRef } from "react";

const SZ = 500, CX = 250, CY = 250;

function deg2rad(d: number) { return d * Math.PI / 180; }

// Round to 3 decimal places to prevent SSR/client floating-point mismatches
function f(n: number) { return Math.round(n * 1000) / 1000; }

function pos(angleDeg: number, r: number): [number, number] {
  const a = deg2rad(angleDeg - 90);
  return [f(CX + r * Math.cos(a)), f(CY + r * Math.sin(a))];
}

// Sword-shaped hand polygon pointing at 12 o'clock, rotated by parent <g>
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

// ─── Epoch Converter Helpers ─────────────────────────────────────────────────

/** Returns true if the given date is in DST (summer time) */
function isDST(d: Date): boolean {
  const jan = new Date(d.getFullYear(), 0, 1);
  const jul = new Date(d.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return d.getTimezoneOffset() < stdOffset;
}

/** Returns a formatted UTC offset string, e.g. "UTC+02:00" */
function utcOffsetLabel(d: Date): string {
  const off = -d.getTimezoneOffset();
  const h = Math.floor(Math.abs(off) / 60);
  const m = Math.abs(off) % 60;
  return `UTC${off >= 0 ? "+" : "-"}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface DateParts {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number;
}

function extractParts(d: Date, utc: boolean): DateParts {
  return utc
    ? { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
        hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() }
    : { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
        hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
}

/** Displays date parts as individual labeled boxes */
function DatePartsRow({
  parts, label, dst,
}: { parts: DateParts; label: string; dst?: boolean }) {
  const fields: [string, number | string][] = [
    ["Jahr", parts.year],
    ["Mon",  String(parts.month).padStart(2, "0")],
    ["Tag",  String(parts.day).padStart(2, "0")],
    ["Std",  String(parts.hour).padStart(2, "0")],
    ["Min",  String(parts.minute).padStart(2, "0")],
    ["Sek",  String(parts.second).padStart(2, "0")],
  ];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] tracking-[0.3em] uppercase text-gray-600">{label}</span>
        {dst !== undefined && (
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded tracking-wider ${
            dst ? "bg-amber-900/30 text-amber-500" : "bg-blue-900/20 text-blue-500"
          }`}>
            {dst ? "Sommerzeit" : "Winterzeit"}
          </span>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {fields.map(([lbl, val]) => (
          <div key={lbl} className="flex flex-col items-center">
            <span className="text-[9px] text-gray-700 mb-0.5 tracking-wider">{lbl}</span>
            <div className="font-mono text-sm text-gray-300 bg-gray-800/60 border border-gray-700/40
                            rounded-lg px-2 py-1.5 leading-none min-w-[2.6rem] text-center">
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full Epoch Converter section */
function EpochConverter({ now }: { now: Date | null }) {
  // ── Date → Timestamp state ──
  const [d2tMode, setD2tMode] = useState<"local" | "utc">("local");
  const [d2t, setD2t] = useState({ year:"", month:"", day:"", hour:"", minute:"", second:"" });
  const [d2tResult, setD2tResult] = useState<number | null>(null);
  const [d2tError, setD2tError] = useState("");

  // ── Timestamp → Date state ──
  const [t2dInput, setT2dInput] = useState("");
  const [t2dResult, setT2dResult] = useState<Date | null>(null);
  const [t2dError, setT2dError] = useState("");

  /** Validate and convert date fields → epoch */
  function convertD2T() {
    const y  = parseInt(d2t.year);
    const mo = parseInt(d2t.month);
    const dy = parseInt(d2t.day);
    const h  = parseInt(d2t.hour  || "0");
    const mi = parseInt(d2t.minute || "0");
    const s  = parseInt(d2t.second || "0");

    if (isNaN(y) || isNaN(mo) || isNaN(dy)) return setD2tError("Jahr, Monat und Tag sind Pflichtfelder."), setD2tResult(null);
    if (mo < 1 || mo > 12)  return setD2tError("Monat: 1–12"), setD2tResult(null);
    if (dy < 1 || dy > 31)  return setD2tError("Tag: 1–31"), setD2tResult(null);
    if (h  < 0 || h  > 23)  return setD2tError("Stunde: 0–23"), setD2tResult(null);
    if (mi < 0 || mi > 59)  return setD2tError("Minute: 0–59"), setD2tResult(null);
    if (s  < 0 || s  > 59)  return setD2tError("Sekunde: 0–59"), setD2tResult(null);

    const date = d2tMode === "utc"
      ? new Date(Date.UTC(y, mo - 1, dy, h, mi, s))
      : new Date(y, mo - 1, dy, h, mi, s);

    if (isNaN(date.getTime())) return setD2tError("Ungültiges Datum."), setD2tResult(null);

    // Catch rolled-over dates (e.g. Feb 30 → Mar 2)
    const check = d2tMode === "utc"
      ? [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
      : [date.getFullYear(),    date.getMonth() + 1,    date.getDate()];
    if (check[0] !== y || check[1] !== mo || check[2] !== dy)
      return setD2tError("Datum existiert nicht (z.B. 30. Februar)."), setD2tResult(null);

    setD2tError("");
    setD2tResult(Math.floor(date.getTime() / 1000));
  }

  /** Validate and convert epoch → date */
  function convertT2D() {
    const ts = Number(t2dInput.trim());
    if (!t2dInput.trim() || isNaN(ts)) return setT2dError("Bitte einen numerischen Timestamp eingeben."), setT2dResult(null);
    if (ts < -8_640_000_000 || ts > 8_640_000_000) return setT2dError("Timestamp außerhalb des zulässigen Bereichs."), setT2dResult(null);
    setT2dError("");
    setT2dResult(new Date(ts * 1000));
  }

  function useNowForD2T() {
    if (!now) return;
    setD2t({
      year:   String(now.getFullYear()),
      month:  String(now.getMonth() + 1),
      day:    String(now.getDate()),
      hour:   String(now.getHours()),
      minute: String(now.getMinutes()),
      second: String(now.getSeconds()),
    });
    setD2tResult(null);
    setD2tError("");
  }

  function useNowForT2D() {
    if (!now) return;
    setT2dInput(String(Math.floor(now.getTime() / 1000)));
    setT2dResult(null);
    setT2dError("");
  }

  // Shared styles
  const inputCls = "w-full font-mono text-sm text-gray-300 bg-gray-800/60 border border-gray-700/50 " +
    "rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-600 placeholder:text-gray-700 " +
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const btnPrimary   = "px-4 py-2 rounded-lg text-xs font-medium tracking-wider bg-gray-700/70 hover:bg-gray-600/70 text-gray-200 border border-gray-600/50 transition-colors";
  const btnSecondary = "px-4 py-2 rounded-lg text-xs font-medium tracking-wider bg-transparent hover:bg-gray-800/60 text-gray-600 hover:text-gray-400 border border-gray-800 transition-colors";
  const lbl          = "text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-1 block";

  const epochNow   = now ? Math.floor(now.getTime() / 1000) : null;
  const dstNow     = now ? isDST(now) : false;
  const partsLocal = now ? extractParts(now, false) : null;
  const partsUTC   = now ? extractParts(now, true)  : null;

  const t2dLocal = t2dResult ? extractParts(t2dResult, false) : null;
  const t2dUTC   = t2dResult ? extractParts(t2dResult, true)  : null;

  return (
    <div className="relative z-10 mt-12 w-full max-w-[460px] space-y-5">

      {/* ── Section header ── */}
      <div className="border-b border-gray-800 pb-3">
        <h2 className="text-xs tracking-[0.4em] uppercase text-gray-500 font-medium">
          Epoch &amp; Unix Timestamp Conversion
        </h2>
      </div>

      {/* ── Current Timestamp ── */}
      <div className="border border-gray-800/60 rounded-2xl bg-gray-900/30 backdrop-blur-sm p-5 space-y-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-gray-600">
          Aktueller Unix Timestamp
        </div>

        {/* Large epoch number */}
        <div className="font-mono text-[2rem] font-light tracking-widest text-gray-300 tabular-nums">
          {epochNow ?? "—"}
        </div>
        <p className="text-[10px] text-gray-700 font-mono -mt-2">
          Sekunden seit 01.01.1970 00:00:00 UTC · aktualisiert jede Sekunde
        </p>

        {/* Separated date parts — local + UTC */}
        {partsLocal && <DatePartsRow parts={partsLocal} label={`Lokale Zeit · ${utcOffsetLabel(now!)}`} dst={dstNow} />}
        {partsUTC   && <DatePartsRow parts={partsUTC}   label="UTC / GMT" />}
      </div>

      {/* ── Date → Timestamp ── */}
      <div className="border border-gray-800/60 rounded-2xl bg-gray-900/30 backdrop-blur-sm p-5 space-y-4">

        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.3em] uppercase text-gray-600">Datum → Timestamp</div>
          {/* UTC / Lokal toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700/50 text-[10px] font-mono tracking-wider">
            {(["local","utc"] as const).map(m => (
              <button key={m} onClick={() => { setD2tMode(m); setD2tResult(null); setD2tError(""); }}
                className={`px-3 py-1.5 transition-colors ${d2tMode === m ? "bg-gray-700 text-gray-200" : "text-gray-600 hover:text-gray-400"}`}>
                {m === "local" ? "Lokal" : "UTC"}
              </button>
            ))}
          </div>
        </div>

        {/* Input grid */}
        <div className="grid grid-cols-3 gap-2">
          {([
            ["year",   "Jahr",  "2026"],
            ["month",  "Mon",   "04"],
            ["day",    "Tag",   "01"],
            ["hour",   "Std",   "00"],
            ["minute", "Min",   "00"],
            ["second", "Sek",   "00"],
          ] as const).map(([key, label, ph]) => (
            <div key={key}>
              <span className={lbl}>{label}</span>
              <input type="number" placeholder={ph}
                value={d2t[key]}
                onChange={e => { setD2t(p => ({ ...p, [key]: e.target.value })); setD2tResult(null); setD2tError(""); }}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={convertD2T}   className={btnPrimary}>Berechnen</button>
          <button onClick={useNowForD2T} className={btnSecondary}>Jetzt verwenden</button>
          <button onClick={() => { setD2t({ year:"",month:"",day:"",hour:"",minute:"",second:"" }); setD2tResult(null); setD2tError(""); }}
            className={btnSecondary}>Zurücksetzen</button>
        </div>

        {d2tError && (
          <div className="text-xs font-mono text-red-400/80 bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2">
            ⚠ {d2tError}
          </div>
        )}

        {d2tResult !== null && !d2tError && (
          <div>
            <span className={lbl}>Ergebnis</span>
            <div className="font-mono text-2xl text-gray-200 bg-gray-800/50 border border-gray-700/40 rounded-xl px-4 py-3 tracking-wider tabular-nums">
              {d2tResult}
            </div>
            <p className="text-[10px] font-mono text-gray-700 mt-1">
              {d2tMode === "utc"
                ? "Interpretiert als UTC"
                : `Interpretiert als lokale Zeit · ${isDST(new Date(d2tResult * 1000)) ? "Sommerzeit" : "Winterzeit"}`}
            </p>
          </div>
        )}
      </div>

      {/* ── Timestamp → Date ── */}
      <div className="border border-gray-800/60 rounded-2xl bg-gray-900/30 backdrop-blur-sm p-5 space-y-4">

        <div className="text-[10px] tracking-[0.3em] uppercase text-gray-600">Timestamp → Datum</div>

        <div>
          <span className={lbl}>Unix Timestamp (Sekunden)</span>
          <input type="number" placeholder="z. B. 1775286565"
            value={t2dInput}
            onChange={e => { setT2dInput(e.target.value); setT2dResult(null); setT2dError(""); }}
            className={inputCls}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={convertT2D}   className={btnPrimary}>Umrechnen</button>
          <button onClick={useNowForT2D} className={btnSecondary}>Jetzt verwenden</button>
          <button onClick={() => { setT2dInput(""); setT2dResult(null); setT2dError(""); }}
            className={btnSecondary}>Zurücksetzen</button>
        </div>

        {t2dError && (
          <div className="text-xs font-mono text-red-400/80 bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2">
            ⚠ {t2dError}
          </div>
        )}

        {t2dResult && t2dLocal && t2dUTC && !t2dError && (
          <div className="space-y-3">
            <DatePartsRow parts={t2dLocal} label={`Lokale Zeit · ${utcOffsetLabel(t2dResult)}`} dst={isDST(t2dResult)} />
            <DatePartsRow parts={t2dUTC}   label="UTC / GMT" />
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Tachymeter: [speed km/h, angle in degrees from 12 o'clock]
const TACHY: [number, number][] = [
  [500, 43], [400, 54], [300, 72], [240, 90],
  [200, 108], [150, 144], [120, 180], [100, 216],
  [90, 240], [80, 270], [75, 288], [70, 309],
];

export default function UhrPage() {
  const [time, setTime] = useState<Date | null>(null);
  const [synced, setSynced] = useState(false);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    sync();
    const id = setInterval(sync, 60000);
    return () => { clearInterval(id); cancelAnimationFrame(rafRef.current); };
  }, []);

  function sync() {
    const t0 = Date.now();
    fetch("https://worldtime.formality.de/api/timezone/Europe/Vienna")
      .then(r => r.json())
      .then(data => {
        const t1 = Date.now();
        offsetRef.current = new Date(data.datetime).getTime() + (t1 - t0) / 2 - t1;
        setSynced(true);
        startTick();
      })
      .catch(() => { offsetRef.current = 0; setSynced(false); startTick(); });
  }

  function startTick() {
    cancelAnimationFrame(rafRef.current);
    const loop = () => {
      setTime(new Date(Date.now() + offsetRef.current));
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }

  const pad = (n: number, s = 2) => String(n).padStart(s, "0");

  const msVal    = time ? time.getMilliseconds() : 0;
  const sec      = time ? time.getSeconds() + msVal / 1000 : 0;
  const min      = time ? time.getMinutes() + sec / 60 : 0;
  const hr       = time ? (time.getHours() % 12) + min / 60 : 0;
  const secAngle = sec * 6;
  const minAngle = min * 6;
  const hrAngle  = hr * 30;
  const dateNum  = time ? time.getDate() : 0;

  // Which 5-second index is currently lit (0–11), -1 if between marks or after 500ms
  const secInt   = Math.floor(sec);
  const activeIdx = (time && secInt % 5 === 0 && msVal < 250) ? (secInt / 5) % 12 : -1;

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center py-12 px-4">

      {/* Ambient warm glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(80,55,20,0.12) 0%, transparent 70%)" }}/>

      {/* Brand header */}
      <div className="mb-7 text-center relative z-10 select-none">
        <p className="text-[9px] tracking-[0.65em] uppercase text-gray-700 font-light mb-2">
          Precision Timepiece · Since 1981
        </p>
        <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.55em" }}
          className="text-[1.35rem] uppercase font-normal text-gray-300">
          Kežar
        </h1>
      </div>

      {/* ── WATCH SVG ── */}
      <div className="relative z-10 w-full flex justify-center">
        {!time && (
          <div className="w-full max-w-[460px] aspect-square flex items-center justify-center">
            <p className="font-mono text-gray-700 tracking-[0.5em] animate-pulse text-xs">
              SYNCHRONISIERE...
            </p>
          </div>
        )}
        <svg viewBox={`0 0 ${SZ} ${SZ}`} className={`w-full max-w-[460px] ${!time ? "opacity-0 absolute" : ""}`}
          style={{ filter: "drop-shadow(0 30px 80px rgba(0,0,0,0.98)) drop-shadow(0 0 40px rgba(90,65,25,0.08))" }}>
          <defs>

            {/* Steel case */}
            <linearGradient id="caseGrad" x1="10%" y1="5%" x2="90%" y2="95%">
              <stop offset="0%"   stopColor="#f0f0f0"/>
              <stop offset="18%"  stopColor="#bdbdbd"/>
              <stop offset="38%"  stopColor="#e8e8e8"/>
              <stop offset="58%"  stopColor="#a8a8a8"/>
              <stop offset="80%"  stopColor="#d2d2d2"/>
              <stop offset="100%" stopColor="#888"/>
            </linearGradient>

            {/* Dark bezel */}
            <linearGradient id="bezelGrad" x1="10%" y1="5%" x2="90%" y2="95%">
              <stop offset="0%"   stopColor="#383838"/>
              <stop offset="45%"  stopColor="#181818"/>
              <stop offset="100%" stopColor="#2c2c2c"/>
            </linearGradient>

            {/* Dial – very dark, slight blue-black */}
            <radialGradient id="dialGrad" cx="38%" cy="32%" r="72%">
              <stop offset="0%"   stopColor="#1d1d1d"/>
              <stop offset="60%"  stopColor="#0d0d0d"/>
              <stop offset="100%" stopColor="#060606"/>
            </radialGradient>

            {/* Hour hand – polished steel */}
            <linearGradient id="hrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#282828"/>
              <stop offset="18%"  stopColor="#b5b5b5"/>
              <stop offset="50%"  stopColor="#ececec"/>
              <stop offset="82%"  stopColor="#b5b5b5"/>
              <stop offset="100%" stopColor="#282828"/>
            </linearGradient>

            {/* Minute hand */}
            <linearGradient id="minGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#1e1e1e"/>
              <stop offset="20%"  stopColor="#9e9e9e"/>
              <stop offset="50%"  stopColor="#d8d8d8"/>
              <stop offset="80%"  stopColor="#9e9e9e"/>
              <stop offset="100%" stopColor="#1e1e1e"/>
            </linearGradient>

            {/* Luminous stripe on hands */}
            <linearGradient id="lumiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#a0ffcc" stopOpacity="0"/>
              <stop offset="28%"  stopColor="#a0ffcc" stopOpacity="0.42"/>
              <stop offset="72%"  stopColor="#a0ffcc" stopOpacity="0.42"/>
              <stop offset="100%" stopColor="#a0ffcc" stopOpacity="0"/>
            </linearGradient>

            {/* Applied indices */}
            <linearGradient id="idxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#ffffff"/>
              <stop offset="45%"  stopColor="#d5d5d5"/>
              <stop offset="100%" stopColor="#808080"/>
            </linearGradient>

            {/* Center cap */}
            <radialGradient id="capGrad" cx="30%" cy="25%" r="65%">
              <stop offset="0%"   stopColor="#e8e8e8"/>
              <stop offset="50%"  stopColor="#888"/>
              <stop offset="100%" stopColor="#222"/>
            </radialGradient>

            {/* Seconds glow */}
            <filter id="secGlow">
              <feGaussianBlur stdDeviation="1.8" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>

            {/* Index glow — blue shimmer at every 5-second mark */}
            <filter id="idxGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feFlood floodColor="#38bdf8" floodOpacity="0.9" result="color"/>
              <feComposite in="color" in2="SourceGraphic" operator="in" result="tinted"/>
              <feGaussianBlur in="tinted" stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>

            {/* Subtle hand shadow */}
            <filter id="handShadow" x="-30%" y="-10%" width="160%" height="120%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6"/>
            </filter>

          </defs>

          {/* ── STEEL CASE ── */}
          <circle cx={CX} cy={CY} r={245} fill="url(#caseGrad)"/>
          {/* Highlight ring */}
          <circle cx={CX} cy={CY} r={244} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8"/>
          {/* Inner shadow ring */}
          <circle cx={CX} cy={CY} r={237} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="2.5"/>

          {/* Case brushing — subtle alternating panels */}
          {Array.from({ length: 24 }, (_, i) => {
            const a1 = deg2rad(i * 15 - 90);
            const a2 = deg2rad(i * 15 + 7 - 90);
            const r1 = 237, r2 = 244;
            return (
              <path key={i}
                d={`M ${f(CX + r1 * Math.cos(a1))} ${f(CY + r1 * Math.sin(a1))} A ${r1} ${r1} 0 0 1 ${f(CX + r1 * Math.cos(a2))} ${f(CY + r1 * Math.sin(a2))} L ${f(CX + r2 * Math.cos(a2))} ${f(CY + r2 * Math.sin(a2))} A ${r2} ${r2} 0 0 0 ${f(CX + r2 * Math.cos(a1))} ${f(CY + r2 * Math.sin(a1))} Z`}
                fill={i % 2 === 0 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.04)"}
              />
            );
          })}

          {/* ── TACHYMETER BEZEL ── */}
          <circle cx={CX} cy={CY} r={234} fill="url(#bezelGrad)"/>
          <circle cx={CX} cy={CY} r={234} fill="none" stroke="#484848" strokeWidth="0.6"/>
          <circle cx={CX} cy={CY} r={205} fill="none" stroke="#111" strokeWidth="2.5"/>

          {/* Tachymeter tick marks */}
          {Array.from({ length: 61 }, (_, i) => {
            const a = i * 6;
            if (a < 40 || a > 360) return null;
            const [ox, oy] = pos(a, 231);
            const isMajor = i % 5 === 0;
            const [ix, iy] = pos(a, isMajor ? 216 : 224);
            return (
              <line key={i} x1={ox} y1={oy} x2={ix} y2={iy}
                stroke={isMajor ? "#777" : "#444"}
                strokeWidth={isMajor ? 1.3 : 0.7}/>
            );
          })}

          {/* Tachymeter numbers */}
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

          {/* "TACHYMÈTRE" at 12 o'clock on bezel */}
          <text x={CX} y={CY - 220} textAnchor="middle" dominantBaseline="central"
            fontSize="7.5" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="600" fill="#666" letterSpacing="3">
            TACHYMÈTRE
          </text>

          {/* ── DIAL ── */}
          <circle cx={CX} cy={CY} r={203} fill="url(#dialGrad)"/>

          {/* Sunburst texture (very faint radial lines) */}
          {Array.from({ length: 72 }, (_, i) => {
            const a = deg2rad(i * 5 - 90);
            return (
              <line key={i}
                x1={f(CX + 5 * Math.cos(a))} y1={f(CY + 5 * Math.sin(a))}
                x2={f(CX + 201 * Math.cos(a))} y2={f(CY + 201 * Math.sin(a))}
                stroke="rgba(255,255,255,0.014)" strokeWidth="0.5"/>
            );
          })}

          {/* Chapter ring */}
          <circle cx={CX} cy={CY} r={201} fill="none" stroke="#2a2a2a" strokeWidth="3.5"/>
          <circle cx={CX} cy={CY} r={199} fill="none" stroke="#383838" strokeWidth="0.5"/>

          {/* Minute tick marks */}
          {Array.from({ length: 60 }, (_, i) => {
            if (i % 5 === 0) return null;
            const [ox, oy] = pos(i * 6, 195);
            const [ix, iy] = pos(i * 6, 187);
            return (
              <line key={i} x1={ox} y1={oy} x2={ix} y2={iy}
                stroke="#464646" strokeWidth="1" strokeLinecap="round"/>
            );
          })}

          {/* Applied hour indices (skip 3 o'clock → date window) */}
          {Array.from({ length: 12 }, (_, i) => {
            if (i === 3) return null; // replaced by date window
            const angle = i * 30;
            const isMain = i % 3 === 0;
            const outer = 195, inner = isMain ? 168 : 178;
            const mid = (outer + inner) / 2;
            const [mx, my] = pos(angle, mid);
            const len = outer - inner;
            const w = isMain ? 8.5 : 5.5;
            const lit = i === activeIdx;
            return (
              <g key={i} filter={lit ? "url(#idxGlow)" : undefined}>
                {/* Shadow */}
                <rect x={mx - w / 2 + 1} y={my - len / 2 + 1} width={w} height={len} rx={1.2}
                  fill="rgba(0,0,0,0.6)"
                  transform={`rotate(${angle}, ${mx + 1}, ${my + 1})`}/>
                {/* Index */}
                <rect x={mx - w / 2} y={my - len / 2} width={w} height={len} rx={1.2}
                  fill={lit ? "#7dd3fc" : "url(#idxGrad)"}
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
          {/* Small line below brand */}
          <line x1={CX - 28} y1={CY - 55} x2={CX + 28} y2={CY - 55}
            stroke="#2a2a2a" strokeWidth="0.8"/>
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

          {/* ── DATE WINDOW at 3 o'clock ── */}
          {/* Outer frame */}
          <rect x={382} y={239} width={26} height={22} rx={2.5}
            fill="#333" stroke="#222" strokeWidth="1"/>
          {/* Paper */}
          <rect x={383} y={240} width={24} height={20} rx={2}
            fill="#f0f0f0"/>
          {/* Divider line (magnifying lens style) */}
          <line x1={395} y1={240} x2={395} y2={260} stroke="#d8d8d8" strokeWidth="0.7"/>
          <text x={395} y={250.5} textAnchor="middle" dominantBaseline="central"
            fontSize="11" fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700" fill="#111">
            {dateNum}
          </text>

          {/* ── HANDS ── */}

          {/* Hour hand */}
          <g transform={`rotate(${hrAngle}, ${CX}, ${CY})`} filter="url(#handShadow)">
            <polygon points={handPoly(112, 26, 7.5, 3)} fill="url(#hrGrad)"/>
            {/* Luminous strip */}
            <rect x={CX - 2} y={CY - 109} width={4} height={90} rx={1.5}
              fill="url(#lumiGrad)"/>
          </g>

          {/* Minute hand */}
          <g transform={`rotate(${minAngle}, ${CX}, ${CY})`} filter="url(#handShadow)">
            <polygon points={handPoly(158, 33, 5.5, 2)} fill="url(#minGrad)"/>
            {/* Luminous strip */}
            <rect x={CX - 1.5} y={CY - 155} width={3} height={132} rx={1}
              fill="url(#lumiGrad)"/>
          </g>

          {/* Second hand */}
          <g transform={`rotate(${secAngle}, ${CX}, ${CY})`} filter="url(#secGlow)">
            {/* Counterweight lollipop */}
            <ellipse cx={CX} cy={CY + 44} rx={8.5} ry={12} fill="#c8001a"/>
            <ellipse cx={CX} cy={CY + 44} rx={4}   ry={6}  fill="#ff1133" opacity="0.65"/>
            {/* Shaft */}
            <line x1={CX} y1={CY + 58} x2={CX} y2={CY - 176}
              stroke="#c8001a" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Tip accent */}
            <line x1={CX} y1={CY - 158} x2={CX} y2={CY - 176}
              stroke="#ff2244" strokeWidth="2.8" strokeLinecap="round"/>
          </g>

          {/* ── CENTER CAP ── */}
          <circle cx={CX} cy={CY} r={11} fill="url(#capGrad)"/>
          <circle cx={CX} cy={CY} r={10.5} fill="none" stroke="#181818" strokeWidth="1.2"/>
          <circle cx={CX} cy={CY} r={4}  fill="#c8c8c8"/>
          <circle cx={CX} cy={CY} r={1.8} fill="#888"/>

        </svg>
      </div>

      {/* ── DIGITAL DISPLAY ── */}
      {time && (
        <div className="mt-8 text-center font-mono relative z-10 select-none">
          <div className="text-[2.6rem] font-extralight tracking-[0.15em] text-gray-500"
            style={{ fontFamily: "'Courier New', monospace" }}>
            {pad(time.getHours())}
            <span className="text-gray-700 mx-1">:</span>
            {pad(time.getMinutes())}
            <span className="text-gray-700 mx-1">:</span>
            {pad(time.getSeconds())}
            <span className="text-[1.3rem] text-gray-700 ml-1">
              .{pad(msVal, 3)}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] tracking-[0.3em] uppercase text-gray-700">
            {time.toLocaleDateString("de-AT", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${synced ? "bg-gray-600 animate-pulse" : "bg-amber-900"}`}/>
            <span className="text-[9px] tracking-[0.4em] uppercase text-gray-700">
              {synced ? "NTP · Europe / Vienna" : "Lokale Zeit"}
            </span>
          </div>

          {/* Unix Timestamp */}
          <div className="mt-4 flex flex-col items-center gap-1">
            <span className="text-[9px] tracking-[0.35em] uppercase text-gray-700">Unix Timestamp</span>
            <span className="font-mono text-lg font-light tracking-widest text-gray-500 tabular-nums">
              {Math.floor(time.getTime() / 1000)}
            </span>
          </div>
        </div>
      )}

      {/* ── INFO SECTION ── */}
      <div className="relative z-10 mt-12 w-full max-w-[460px] border border-gray-800/60 rounded-2xl bg-gray-900/30 backdrop-blur-sm p-6 text-sm text-gray-500 leading-relaxed space-y-4">

        <h2 className="text-xs tracking-[0.4em] uppercase text-gray-600 font-medium border-b border-gray-800 pb-3">
          Wie funktioniert diese Uhr?
        </h2>

        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-700 relative top-[5px]"/>
          <p>
            <span className="text-gray-400 font-medium">Zeitquelle — NTP-Server.</span>{" "}
            Beim Laden der Seite wird einmalig eine Anfrage an den Zeitserver{" "}
            <code className="text-gray-600 text-xs bg-gray-800/60 px-1.5 py-0.5 rounded">
              worldtime.formality.de
            </code>{" "}
            gesendet, der die offizielle Zeitzone <em>Europe/Vienna</em> (UTC+1 / Sommerzeit UTC+2) liefert.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-700 relative top-[5px]"/>
          <p>
            <span className="text-gray-400 font-medium">Latenz-Korrektur.</span>{" "}
            Die Netzwerkverzögerung wird automatisch kompensiert: Die Reisezeit des Pakets
            (Round-Trip-Time) wird halbiert und zur empfangenen Serverzeit addiert,
            damit die angezeigte Zeit trotz Netzwerk-Latenz präzise bleibt.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-700 relative top-[5px]"/>
          <p>
            <span className="text-gray-400 font-medium">Synchronisierungs-Intervall.</span>{" "}
            Nach der ersten Synchronisierung beim Start wird alle{" "}
            <span className="text-gray-400 font-medium">60 Sekunden</span> automatisch
            eine neue Serverabfrage durchgeführt, um etwaige Abweichungen der lokalen
            Browser-Uhr zu korrigieren.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-700 relative top-[5px]"/>
          <p>
            <span className="text-gray-400 font-medium">Flüssige Anzeige.</span>{" "}
            Zwischen den Synchronisierungen läuft die Uhr lokal weiter — angetrieben durch{" "}
            <code className="text-gray-600 text-xs bg-gray-800/60 px-1.5 py-0.5 rounded">
              requestAnimationFrame
            </code>
            , das den Zeiger bis auf Millisekunden genau (~60 Bilder/Sekunde) aktualisiert,
            ohne den Browser zu belasten.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-700 relative top-[5px]"/>
          <p>
            <span className="text-gray-400 font-medium">Fallback.</span>{" "}
            Ist kein Netzwerk verfügbar oder schlägt die Serverabfrage fehl,
            wechselt die Uhr automatisch auf die lokale Browserzeit — der Statusindikator
            oben rechts zeigt in diesem Fall <em>Lokal</em> an.
          </p>
        </div>

      </div>

      {/* ── Epoch & Unix Timestamp Converter ── */}
      <EpochConverter now={time} />

      <div className="h-16" />
    </div>
  );
}
