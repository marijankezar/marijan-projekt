'use client';

import { useCallback, useRef, useState } from 'react';
import { Square } from 'lucide-react';

interface HoldToStopButtonProps {
  onConfirm: () => void;
  holdMs?: number;
  disabled?: boolean;
}

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Muss 3 Sekunden gehalten werden (Pointer Events -> deckt Maus UND Touch ab).
 * Vorzeitiges Loslassen bricht ab, kein Teil-Stop möglich.
 */
export default function HoldToStopButton({ onConfirm, holdMs = 3000, disabled }: HoldToStopButtonProps) {
  const [progress, setProgress] = useState(0); // 0..1
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const cancel = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setHolding(false);
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current;
    const p = Math.min(1, elapsed / holdMs);
    setProgress(p);
    if (p >= 1) {
      setHolding(false);
      setProgress(0);
      onConfirm();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [holdMs, onConfirm]);

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      startRef.current = performance.now();
      setHolding(true);
      rafRef.current = requestAnimationFrame(tick);
    },
    [disabled, tick]
  );

  const countdown = Math.ceil((1 - progress) * (holdMs / 1000));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      className="relative w-32 h-32 rounded-full bg-red-600 text-white shadow-xl select-none touch-none
                 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95
                 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Zum Beenden 3 Sekunden gedrückt halten"
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
        {holding && (
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        )}
      </svg>
      {holding ? (
        <span className="text-4xl font-bold tabular-nums">{countdown}</span>
      ) : (
        <>
          <Square className="w-8 h-8 fill-current" />
          <span className="text-xs font-semibold">Halten zum Stoppen</span>
        </>
      )}
    </button>
  );
}
