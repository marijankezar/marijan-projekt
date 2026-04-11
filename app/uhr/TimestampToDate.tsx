"use client";

import { useState } from "react";
import { getNtpNow } from "./ntp";

const TZ = "Europe/Vienna";

const inputCls =
  "flex-1 min-w-0 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg " +
  "px-3 py-2 text-sm focus:outline-none focus:border-slate-500 " +
  "transition-colors duration-150 placeholder:text-slate-600 " +
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none " +
  "[&::-webkit-outer-spin-button]:appearance-none";

interface Result { utc: string; local: string; iso: string }

export default function TimestampToDate() {
  const [value,  setValue]  = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  function fillNow() {
    setValue(String(Math.floor(getNtpNow() / 1000)));
    setResult(null);
    setError(null);
  }

  function convert() {
    const trimmed = value.trim();
    if (!trimmed) { setError("Bitte einen Timestamp eingeben."); return; }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0) {
      setError("Ungültiger Timestamp — nur positive Ganzzahlen.");
      return;
    }
    setError(null);
    const date = new Date(num * 1000);
    setResult({
      utc:   date.toUTCString(),
      local: date.toLocaleString("de-AT", { timeZone: TZ, hour12: false }),
      iso:   date.toISOString(),
    });
  }

  const rows: [string, string][] = result
    ? [["UTC", result.utc], [TZ, result.local], ["ISO 8601", result.iso]]
    : [];

  return (
    <section
      aria-labelledby="ts-to-date-heading"
      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-4
                 transition-colors duration-200 hover:border-slate-700"
    >
      <h2
        id="ts-to-date-heading"
        className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500"
      >
        Timestamp → Datum
      </h2>

      {/* Eingabe + Jetzt */}
      <div className="flex gap-2">
        <label htmlFor="ts-input" className="sr-only">Unix-Timestamp (Sekunden)</label>
        <input
          id="ts-input"
          type="number"
          value={value}
          placeholder="z. B. 1744127527"
          onChange={e => { setValue(e.target.value); setResult(null); setError(null); }}
          onKeyDown={e => e.key === "Enter" && convert()}
          aria-describedby={error ? "ts-error" : "ts-hint"}
          className={inputCls}
        />
        <button
          onClick={fillNow}
          aria-label="Aktuellen Unix-Timestamp einfügen"
          title="Aktuellen Timestamp einfügen"
          className="shrink-0 rounded-lg border border-slate-700 hover:border-slate-500
                     text-slate-400 hover:text-slate-200 text-xs px-3
                     transition-all duration-150
                     focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
        >
          Jetzt
        </button>
      </div>
      <p id="ts-hint" className="sr-only">
        Gib einen Unix-Timestamp in Sekunden ein und klicke auf Umrechnen.
      </p>

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
          id="ts-error"
          role="alert"
          aria-live="assertive"
          className="text-xs text-red-400 text-center"
        >
          {error}
        </p>
      )}

      {result && !error && (
        <div
          className="rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-3"
          aria-live="polite"
          aria-atomic="true"
        >
          {rows.map(([label, val]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 tracking-wider uppercase">{label}</span>
              <span
                className="text-xs text-slate-300 break-all"
                style={{ fontFamily: "Courier New, monospace" }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
