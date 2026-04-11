"use client";

import { useEffect, useRef } from "react";
import { getNtpNow } from "./ntp";

/**
 * Ruft onTick exakt an der NTP-Sekundengrenze auf.
 *
 * delay = 1000 − (getNtpNow() % 1000)
 * → der nächste setTimeout feuert präzise zu Beginn der nächsten NTP-Sekunde.
 * Kein Drift: jeder Timeout berechnet den Delay neu relativ zur NTP-Zeit.
 *
 * visibilitychange: Tab wurde in Hintergrund/Vordergrund gewechselt →
 * sofortiger Re-Sync damit keine Sekunde übersprungen wird.
 */
export function useSecondTick(onTick: () => void): void {
  const callbackRef = useRef(onTick);
  callbackRef.current = onTick;

  useEffect(() => {
    const timerRef = { current: null as ReturnType<typeof setTimeout> | null };

    function tick() {
      callbackRef.current();
    }

    function scheduleNext() {
      const delay = 1000 - (getNtpNow() % 1000);
      timerRef.current = setTimeout(() => {
        tick();
        scheduleNext();
      }, Math.max(delay, 1));
    }

    function onVisible() {
      if (document.hidden) return;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      tick();
      scheduleNext();
    }
    document.addEventListener("visibilitychange", onVisible);

    tick();
    scheduleNext();

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
