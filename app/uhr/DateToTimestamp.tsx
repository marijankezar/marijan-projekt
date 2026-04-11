"use client";

import { useState } from "react";
import { getNtpNow } from "./ntp";

interface Result { unix: number; utc: string; local: string }

const inputCls =
  "w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg " +
  "px-3 py-2 text-sm text-center focus:outline-none focus:border-slate-500 " +
  "transition-colors duration-150 placeholder:text-slate-600 " +
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none " +
  "[&::-webkit-outer-spin-button]:appearance-none";

const labelCls = "text-[10px] text-slate-500 text-center tracking-wider block mb-1";

export default function DateToTimestamp() {
  const now = new Date(getNtpNow());
  const [y,  setY]  = useState(String(now.getFullYear()));
  const [mo, setMo] = useState(String(now.getMonth() + 1));
  const [d,  setD]  = useState(String(now.getDate()));
  const [h,  setH]  = useState("0");
  const [mi, setMi] = useState("0");
  const [s,  setS]  = useState("0");
  const [result, setResult] = useState<Result | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  function convert() {
    const yv = parseInt(y), mov = parseInt(mo), dv = parseInt(d);
    const hv = parseInt(h), miv = parseInt(mi), sv = parseInt(s);
    if ([yv,mov,dv,hv,miv,sv].some(isNaN)) { setError("Bitte alle Felder ausfüllen."); return; }
    if (mov < 1 || mov > 12) { setError("Monat: 1–12.");   return; }
    if (dv  < 1 || dv  > 31) { setError("Tag: 1–31.");     return; }
    if (hv  < 0 || hv  > 23) { setError("Stunde: 0–23.");  return; }
    if (miv < 0 || miv > 59) { setError("Minute: 0–59.");  return; }
    if (sv  < 0 || sv  > 59) { setError("Sekunde: 0–59."); return; }
    setError(null);
    const date = new Date(yv, mov - 1, dv, hv, miv, sv);
    setResult({
      unix:  Math.floor(date.getTime() / 1000),
      utc:   date.toUTCString(),
      local: date.toLocaleString("de-AT", { timeZone: "Europe/Vienna", hour12: false }),
    });
  }

  const fields: [string, string, React.Dispatch<React.SetStateAction<string>>, string, number, number][] = [
    ["Jahr",    y,  setY,  "2026", 1970, 9999],
    ["Monat",   mo, setMo, "1",    1,    12  ],
    ["Tag",     d,  setD,  "1",    1,    31  ],
    ["Stunde",  h,  setH,  "0",    0,    23  ],
    ["Minute",  mi, setMi, "0",    0,    59  ],
    ["Sekunde", s,  setS,  "0",    0,    59  ],
  ];

  return (
    <section
      aria-labelledby="date-to-ts-heading"
      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-4
                 transition-colors duration-200 hover:border-slate-700"
    >
      <h2
        id="date-to-ts-heading"
        className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500"
      >
        Datum → Timestamp
      </h2>

      <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="date-to-ts-heading">
        {fields.map(([label, value, setter, placeholder, min, max]) => {
          const fieldId = `d2ts-${label.toLowerCase()}`;
          return (
            <div key={label}>
              <label htmlFor={fieldId} className={labelCls}>{label}</label>
              <input
                id={fieldId}
                type="number"
                value={value}
                min={min}
                max={max}
                placeholder={placeholder}
                onChange={e => { setter(e.target.value); setResult(null); setError(null); }}
                onKeyDown={e => e.key === "Enter" && convert()}
                aria-describedby={error ? "d2ts-error" : undefined}
                className={inputCls}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={convert}
        className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-[0.98]
                   text-slate-100 text-sm font-medium py-2.5 transition-all duration-150
                   focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
      >
        Umrechnen
      </button>

      {error && (
        <p
          id="d2ts-error"
          role="alert"
          aria-live="assertive"
          className="text-xs text-red-400 text-center"
        >
          {error}
        </p>
      )}

      {result && !error && (
        <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-3" aria-live="polite" aria-atomic="true">
          <ResultRow label="Unix-Timestamp">
            <span className="text-slate-100 text-xl tabular-nums"
              style={{ fontFamily: "Courier New, monospace" }}>
              {result.unix}
            </span>
          </ResultRow>
          <ResultRow label="UTC">
            <Mono>{result.utc}</Mono>
          </ResultRow>
          <ResultRow label="Lokal (Europe/Vienna)">
            <Mono>{result.local}</Mono>
          </ResultRow>
        </div>
      )}
    </section>
  );
}

function ResultRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-slate-500 tracking-wider uppercase">{label}</span>
      <span className="text-sm text-slate-300 break-all">{children}</span>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "Courier New, monospace", fontSize: "0.75rem" }}>
      {children}
    </span>
  );
}
