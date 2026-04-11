"use client";

import { useRef } from "react";
import { useSecondTick } from "./useSecondTick";
import { getNtpNow } from "./ntp";

const TZ = "Europe/Vienna";

const fmtWeekday = new Intl.DateTimeFormat("de-AT", { weekday: "long",   timeZone: TZ });
const fmtDate    = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const fmtTime    = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: TZ });

export default function PrecisionTime() {
  const weekdayRef = useRef<HTMLSpanElement>(null);
  const dateRef    = useRef<HTMLSpanElement>(null);
  const timeRef    = useRef<HTMLSpanElement>(null);

  useSecondTick(() => {
    const now = new Date(getNtpNow());
    if (weekdayRef.current) weekdayRef.current.textContent = fmtWeekday.format(now);
    if (dateRef.current)    dateRef.current.textContent    = fmtDate.format(now);
    if (timeRef.current)    timeRef.current.textContent    = fmtTime.format(now);
  });

  return (
    <section
      aria-label="Aktuelle Uhrzeit"
      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center
                 transition-colors duration-200 hover:border-slate-700"
    >
      <span
        ref={weekdayRef}
        className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 mb-1.5"
        aria-hidden="true"
      >
        —
      </span>
      <span ref={dateRef} className="block text-slate-400 text-sm mb-5">
        —
      </span>
      {/* aria-live="polite": Screenreader liest die Zeit jede Sekunde an — ohne den Nutzer zu unterbrechen */}
      <span
        ref={timeRef}
        className="block text-slate-100 mb-5"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Aktuelle Uhrzeit"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "clamp(2.2rem, 9vw, 3.8rem)",
          fontWeight: 200,
          letterSpacing: "0.06em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        --:--:--
      </span>
      <span className="text-[10px] text-slate-600 tracking-widest uppercase">
        {TZ} &nbsp;·&nbsp; NTP-synchronisiert
      </span>
    </section>
  );
}
