"use client";

import AnalogClock      from "./AnalogClock";
import PrecisionTime    from "./PrecisionTime";
import UnixTimestamp    from "./UnixTimestamp";
import ClockExplanation from "./ClockExplanation";
import DateToTimestamp  from "./DateToTimestamp";
import TimestampToDate  from "./TimestampToDate";

export default function UhrPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#060606] py-12 px-4"
      style={{ position: "relative", colorScheme: "dark" }}
    >
      {/* Screenreader-Überschrift (WCAG 1.3.1 — Heading-Hierarchie) */}
      <h1 className="sr-only">Kežar Atomuhr — Präzisionsuhr für Europe/Vienna</h1>

      {/* Warmer Ambiente-Schein — dekorativ */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(80,55,20,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center gap-8">

        {/* 1 — Kežar Analoge Uhr (inkl. Brand-Header) */}
        <AnalogClock />

        {/* 2 — Wochentag · Datum · Uhrzeit (Europe/Vienna) */}
        <PrecisionTime />

        {/* 3 — Aktueller Unix-Timestamp */}
        <UnixTimestamp />

        {/* 4 — Erklärung */}
        <ClockExplanation />

        {/* 5 + 6 — Konverter: nebeneinander ab md, gestapelt auf Mobile */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <DateToTimestamp />
          <TimestampToDate />
        </div>

      </div>
    </main>
  );
}
