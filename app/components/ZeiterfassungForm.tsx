'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Calendar, AlertCircle, Check, X } from 'lucide-react';

interface ZeiterfassungFormProps {
  onSave: (data: ZeiterfassungData) => Promise<void>;
  onCancel?: () => void;
  maxDauerStunden?: number; // Standard: 16
  erlaubeZukunft?: boolean; // Standard: false
}

export interface ZeiterfassungData {
  datum: string;
  startzeit: string;
  endzeit: string;
  dauer_minuten: number;
  baustelle?: string;
  bemerkung?: string;
}

interface ValidationErrors {
  datum?: string;
  startzeit?: string;
  endzeit?: string;
  dauer?: string;
  baustelle?: string;
}

// Hilfsfunktion: Zeit-String validieren (HH:MM Format)
const isValidTimeFormat = (time: string): boolean => {
  if (!time) return false;
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return regex.test(time);
};

// Hilfsfunktion: Zeit zu Minuten konvertieren
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Hilfsfunktion: Minuten zu Anzeige-Format (H:MM)
const minutesToDisplay = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

// Hilfsfunktion: Minuten zu Langformat
const minutesToLongDisplay = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min`;
  if (m === 0) return `${h} Std`;
  return `${h} Std ${m} Min`;
};

export default function ZeiterfassungForm({
  onSave,
  onCancel,
  maxDauerStunden = 16,
  erlaubeZukunft = false
}: ZeiterfassungFormProps) {
  // Form State
  const [datum, setDatum] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startzeit, setStartzeit] = useState<string>('');
  const [endzeit, setEndzeit] = useState<string>('');
  const [baustelle, setBaustelle] = useState<string>('');
  const [bemerkung, setBemerkung] = useState<string>('');

  // Berechnete Dauer
  const [dauerMinuten, setDauerMinuten] = useState<number | null>(null);

  // Validation & UI State
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dauer berechnen wenn Start- oder Endzeit sich ändern
  const berechneDauer = useCallback(() => {
    if (!startzeit || !endzeit) {
      setDauerMinuten(null);
      return;
    }

    if (!isValidTimeFormat(startzeit) || !isValidTimeFormat(endzeit)) {
      setDauerMinuten(null);
      return;
    }

    const startMinuten = timeToMinutes(startzeit);
    const endMinuten = timeToMinutes(endzeit);
    const dauer = endMinuten - startMinuten;

    setDauerMinuten(dauer);
  }, [startzeit, endzeit]);

  useEffect(() => {
    berechneDauer();
  }, [berechneDauer]);

  // Validierung
  const validate = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    const maxDauerMinuten = maxDauerStunden * 60;

    // Datum validieren
    if (!datum) {
      newErrors.datum = 'Bitte Datum angeben.';
    } else if (!erlaubeZukunft) {
      const selectedDate = new Date(datum);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.datum = 'Das Datum darf nicht in der Zukunft liegen.';
      }
    }

    // Startzeit validieren
    if (!startzeit) {
      newErrors.startzeit = 'Bitte Startzeit im Format HH:MM eingeben (z. B. 08:00).';
    } else if (!isValidTimeFormat(startzeit)) {
      newErrors.startzeit = 'Ungültiges Zeitformat. Bitte HH:MM verwenden (z. B. 08:00).';
    }

    // Endzeit validieren
    if (!endzeit) {
      newErrors.endzeit = 'Bitte Endzeit im Format HH:MM eingeben (z. B. 17:30).';
    } else if (!isValidTimeFormat(endzeit)) {
      newErrors.endzeit = 'Ungültiges Zeitformat. Bitte HH:MM verwenden (z. B. 17:30).';
    }

    // Dauer validieren (nur wenn beide Zeiten gültig sind)
    if (isValidTimeFormat(startzeit) && isValidTimeFormat(endzeit)) {
      const startMinuten = timeToMinutes(startzeit);
      const endMinuten = timeToMinutes(endzeit);
      const dauer = endMinuten - startMinuten;

      if (dauer < 0) {
        newErrors.dauer = 'Die Startzeit darf nicht nach der Endzeit liegen.';
      } else if (dauer === 0) {
        newErrors.dauer = 'Die Dauer darf nicht 0 sein.';
      } else if (dauer > maxDauerMinuten) {
        newErrors.dauer = `Die erfasste Dauer überschreitet den erlaubten Maximalwert (${maxDauerStunden} Stunden).`;
      }
    }

    return newErrors;
  }, [datum, startzeit, endzeit, maxDauerStunden, erlaubeZukunft]);

  // Validierung bei Änderungen ausführen
  useEffect(() => {
    const validationErrors = validate();
    setErrors(validationErrors);
  }, [validate]);

  // Prüfen ob Formular gültig ist
  const isFormValid = Object.keys(errors).length === 0 &&
                      datum && startzeit && endzeit &&
                      dauerMinuten !== null && dauerMinuten > 0;

  // Field touch handler
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Alle Felder als touched markieren
    setTouched({
      datum: true,
      startzeit: true,
      endzeit: true,
      baustelle: true
    });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0 || dauerMinuten === null || dauerMinuten <= 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSave({
        datum,
        startzeit,
        endzeit,
        dauer_minuten: dauerMinuten,
        baustelle: baustelle || undefined,
        bemerkung: bemerkung || undefined
      });

      // Form zurücksetzen nach erfolgreichem Speichern
      setStartzeit('');
      setEndzeit('');
      setBaustelle('');
      setBemerkung('');
      setTouched({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fehleranzeige-Komponente
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm" role="alert">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Neue Zeiterfassung
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Erfasse deine Arbeitszeit
          </p>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{submitError}</span>
          </div>
        </div>
      )}

      {/* Datum */}
      <div>
        <label
          htmlFor="datum"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Datum <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="date"
            id="datum"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            onBlur={() => handleBlur('datum')}
            max={!erlaubeZukunft ? new Date().toISOString().split('T')[0] : undefined}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
              touched.datum && errors.datum
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
            aria-invalid={touched.datum && !!errors.datum}
            aria-describedby={errors.datum ? 'datum-error' : undefined}
          />
        </div>
        {touched.datum && <ErrorMessage message={errors.datum} />}
      </div>

      {/* Zeit von/bis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Startzeit */}
        <div>
          <label
            htmlFor="startzeit"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Zeit von <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="time"
              id="startzeit"
              value={startzeit}
              onChange={(e) => setStartzeit(e.target.value)}
              onBlur={() => handleBlur('startzeit')}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                touched.startzeit && errors.startzeit
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
              aria-invalid={touched.startzeit && !!errors.startzeit}
              aria-describedby={errors.startzeit ? 'startzeit-error' : undefined}
            />
          </div>
          {touched.startzeit && <ErrorMessage message={errors.startzeit} />}
        </div>

        {/* Endzeit */}
        <div>
          <label
            htmlFor="endzeit"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Zeit bis <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="time"
              id="endzeit"
              value={endzeit}
              onChange={(e) => setEndzeit(e.target.value)}
              onBlur={() => handleBlur('endzeit')}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                touched.endzeit && errors.endzeit
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
              aria-invalid={touched.endzeit && !!errors.endzeit}
              aria-describedby={errors.endzeit ? 'endzeit-error' : undefined}
            />
          </div>
          {touched.endzeit && <ErrorMessage message={errors.endzeit} />}
        </div>
      </div>

      {/* Dauer-Fehler */}
      {(touched.startzeit || touched.endzeit) && errors.dauer && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.dauer}</span>
          </div>
        </div>
      )}

      {/* Berechnete Dauer - Live-Feedback */}
      {dauerMinuten !== null && dauerMinuten > 0 && !errors.dauer && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Check className="w-5 h-5" />
              <span className="font-medium">Berechnete Dauer:</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                {minutesToDisplay(dauerMinuten)}
              </span>
              <span className="block text-sm text-green-600 dark:text-green-500">
                ({minutesToLongDisplay(dauerMinuten)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Baustelle (optional) */}
      <div>
        <label
          htmlFor="baustelle"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Baustelle / Projekt
        </label>
        <input
          type="text"
          id="baustelle"
          value={baustelle}
          onChange={(e) => setBaustelle(e.target.value)}
          placeholder="z. B. Projekt XYZ"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Bemerkung (optional) */}
      <div>
        <label
          htmlFor="bemerkung"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Bemerkung
        </label>
        <textarea
          id="bemerkung"
          value={bemerkung}
          onChange={(e) => setBemerkung(e.target.value)}
          placeholder="Optionale Notizen..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            isFormValid && !isSubmitting
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Speichern
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hinweis Pflichtfelder */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        <span className="text-red-500">*</span> Pflichtfelder
      </p>
    </form>
  );
}
