"use client";

import { useRef } from "react";
import { useSecondTick } from "./useSecondTick";
import { getNtpNow } from "./ntp";

export default function UnixTimestamp() {
  const tsRef = useRef<HTMLSpanElement>(null);

  useSecondTick(() => {
    if (tsRef.current) {
      tsRef.current.textContent = String(Math.floor(getNtpNow() / 1000));
    }
  });

  return (
    <section
      aria-label="Unix Timestamp"
      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center
                 transition-colors duration-200 hover:border-slate-700"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 mb-4">
        Unix Timestamp
      </p>
      <span
        ref={tsRef}
        className="block text-slate-100 mb-3"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Aktueller Unix Timestamp in Sekunden"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "clamp(1.7rem, 6vw, 2.8rem)",
          fontWeight: 200,
          letterSpacing: "0.05em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        —
      </span>
      <p className="text-[10px] text-slate-600 tracking-wider">
        Sekunden seit 1.&thinsp;Januar 1970, 00:00:00 UTC
      </p>
    </section>
  );
}
