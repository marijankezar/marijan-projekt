'use client';

import { useState } from 'react';
import type { RegattaLatLng } from './RegattaMap';

interface FinishLineEditorProps {
  initial: { a: RegattaLatLng; b: RegattaLatLng } | null;
  onSave: (line: { a: RegattaLatLng; b: RegattaLatLng }) => Promise<void>;
}

type PlacementTarget = 'a' | 'b';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';

export function useFinishLineEditorState(initial: { a: RegattaLatLng; b: RegattaLatLng } | null) {
  const [a, setA] = useState<RegattaLatLng | null>(initial?.a ?? null);
  const [b, setB] = useState<RegattaLatLng | null>(initial?.b ?? null);
  const [target, setTarget] = useState<PlacementTarget>('a');
  return { a, setA, b, setB, target, setTarget };
}

/**
 * Formularleiste für den Ziellinien-Editor: Modus-Umschalter (Punkt A/B per Kartenklick
 * setzen) + numerische Präzisions-Eingabe. Wird oberhalb der RegattaMap gerendert, die
 * per onMapClick-Prop die Koordinate zurückmeldet.
 */
export default function FinishLineEditor({
  a,
  setA,
  b,
  setB,
  target,
  setTarget,
  onSave,
}: ReturnType<typeof useFinishLineEditorState> & Pick<FinishLineEditorProps, 'onSave'>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canSave = a !== null && b !== null;

  async function handleSave() {
    if (!a || !b) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSave({ a, b });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5 space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Klicke auf die Karte, um Punkt A und Punkt B <strong>quer zum Kurs</strong> zu setzen. Der rote Pfeil zeigt
        die erkannte Zieleinlauf-Richtung (die Seite links von A→B, wenn man von A nach B blickt) — Boote müssen aus
        dieser Richtung kommend die Linie kreuzen, damit die Zielzeit erkannt wird. Zur Präzision können die
        Koordinaten auch direkt eingegeben werden.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTarget('a')}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            target === 'a'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          Punkt A setzen
        </button>
        <button
          type="button"
          onClick={() => setTarget('b')}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            target === 'b'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          Punkt B setzen
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Punkt A</p>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={a?.lat ?? ''}
            onChange={(e) => setA({ lat: Number(e.target.value), lng: a?.lng ?? 0 })}
            className={inputClass}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={a?.lng ?? ''}
            onChange={(e) => setA({ lat: a?.lat ?? 0, lng: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Punkt B</p>
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={b?.lat ?? ''}
            onChange={(e) => setB({ lat: Number(e.target.value), lng: b?.lng ?? 0 })}
            className={inputClass}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={b?.lng ?? ''}
            onChange={(e) => setB({ lat: b?.lat ?? 0, lng: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm">
          Ziellinie gespeichert.
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave || saving}
        className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
      >
        {saving ? 'Speichert…' : 'Ziellinie speichern'}
      </button>
    </div>
  );
}
