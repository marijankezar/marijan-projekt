/**
 * Yardstick-Wertung: reine Berechnungslogik, keine DB-Zugriffe (SQL bleibt in der
 * API-Route), damit die Formel isoliert testbar ist.
 */

export interface ResultInputRow {
  entryId: string;
  boatClassName: string;
  yardstick: number;
  skipperName: string;
  boatName: string;
  sailNumber: string;
  startNumber: string;
  finishAt: string | null; // ISO, null = noch nicht im Ziel / DNF
}

export interface ResultRow extends ResultInputRow {
  sailedSeconds: number | null;
  correctedSeconds: number | null;
  /** Platz nach tatsächlicher Zielzeit. null = kein Zieleinlauf (DNF). */
  place: number | null;
  /** Platz nach Yardstick-korrigierter Zeit. null = kein Zieleinlauf (DNF). */
  placeCorrected: number | null;
}

export type ResultSortBy = 'realtime' | 'corrected' | 'class';

function rankBy<T>(rows: T[], value: (row: T) => number | null): Map<T, number> {
  const finished = rows.filter((r) => value(r) != null).sort((a, b) => value(a)! - value(b)!);
  const ranks = new Map<T, number>();
  finished.forEach((row, i) => ranks.set(row, i + 1));
  return ranks;
}

/**
 * Berechnet Gesegelte Zeit, Yardstick-korrigierte Zeit und beide Platzierungen
 * (Echtzeit + Yardstick) für alle Meldungen einer Veranstaltung.
 *
 * Gesegelte Zeit = Zielzeit - offizielle Startzeit der Veranstaltung.
 * Berechnete Zeit = (Gesegelte Zeit in Sekunden × 100) / Yardstick.
 * Meldungen ohne Zielzeit (DNF) erhalten place=null/placeCorrected=null und landen
 * beim Sortieren immer am Ende.
 */
export function computeResults(rows: ResultInputRow[], eventStartTime: string): ResultRow[] {
  const startMs = new Date(eventStartTime).getTime();

  const withTimes: Omit<ResultRow, 'place' | 'placeCorrected'>[] = rows.map((r) => {
    const sailedSeconds = r.finishAt != null ? (new Date(r.finishAt).getTime() - startMs) / 1000 : null;
    const correctedSeconds = sailedSeconds != null ? (sailedSeconds * 100) / r.yardstick : null;
    return { ...r, sailedSeconds, correctedSeconds };
  });

  const placeByRow = rankBy(withTimes, (r) => r.sailedSeconds);
  const placeCorrectedByRow = rankBy(withTimes, (r) => r.correctedSeconds);

  return withTimes.map((row) => ({
    ...row,
    place: placeByRow.get(row) ?? null,
    placeCorrected: placeCorrectedByRow.get(row) ?? null,
  }));
}

const byPlace = (a: ResultRow, b: ResultRow) => (a.place ?? Infinity) - (b.place ?? Infinity);
const byPlaceCorrected = (a: ResultRow, b: ResultRow) => (a.placeCorrected ?? Infinity) - (b.placeCorrected ?? Infinity);

/** Sortiert ein bereits berechnetes Ergebnis-Array für die Ergebnistabelle. */
export function sortResults(rows: ResultRow[], sortBy: ResultSortBy): ResultRow[] {
  if (sortBy === 'realtime') return [...rows].sort(byPlace);
  if (sortBy === 'class') {
    return [...rows].sort((a, b) => a.boatClassName.localeCompare(b.boatClassName) || byPlaceCorrected(a, b));
  }
  return [...rows].sort(byPlaceCorrected); // 'corrected' (Standard)
}
