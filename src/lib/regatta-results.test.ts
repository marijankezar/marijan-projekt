import { describe, it, expect } from 'vitest';
import { computeResults, sortResults, type ResultInputRow } from './regatta-results';

// Beispiel aus der Spezifikation: Laser=113, Pirat=100, FD=95
const START = '2026-01-01T10:00:00.000Z';

const rows: ResultInputRow[] = [
  {
    entryId: 'laser-1',
    boatClassName: 'Laser',
    yardstick: 113,
    skipperName: 'Laser Skipper',
    boatName: 'Laserboot',
    sailNumber: 'AUT 1',
    startNumber: '1',
    finishAt: '2026-01-01T10:20:00.000Z', // 1200s gesegelt
  },
  {
    entryId: 'pirat-1',
    boatClassName: 'Pirat',
    yardstick: 100,
    skipperName: 'Pirat Skipper',
    boatName: 'Piratenboot',
    sailNumber: 'AUT 2',
    startNumber: '2',
    finishAt: '2026-01-01T10:22:00.000Z', // 1320s gesegelt
  },
  {
    entryId: 'fd-1',
    boatClassName: 'FD',
    yardstick: 95,
    skipperName: 'FD Skipper',
    boatName: 'FDboot',
    sailNumber: 'AUT 3',
    startNumber: '3',
    finishAt: '2026-01-01T10:19:00.000Z', // 1140s gesegelt - schnellste Realzeit
  },
  {
    entryId: 'laser-2-dnf',
    boatClassName: 'Laser',
    yardstick: 113,
    skipperName: 'DNF Skipper',
    boatName: 'Nichtangekommen',
    sailNumber: 'AUT 4',
    startNumber: '4',
    finishAt: null, // kein Zieleinlauf
  },
];

describe('computeResults', () => {
  const results = computeResults(rows, START);
  const byId = (id: string) => results.find((r) => r.entryId === id)!;

  it('berechnet die Gesegelte Zeit als Zielzeit minus Veranstaltungs-Startzeit', () => {
    expect(byId('laser-1').sailedSeconds).toBe(1200);
    expect(byId('pirat-1').sailedSeconds).toBe(1320);
    expect(byId('fd-1').sailedSeconds).toBe(1140);
  });

  it('berechnet die Berechnete Zeit nach der Spec-Formel (Gesegelte Zeit x 100 / Yardstick)', () => {
    expect(byId('laser-1').correctedSeconds).toBeCloseTo((1200 * 100) / 113, 5);
    expect(byId('pirat-1').correctedSeconds).toBeCloseTo((1320 * 100) / 100, 5);
    expect(byId('fd-1').correctedSeconds).toBeCloseTo((1140 * 100) / 95, 5);
  });

  it('setzt Gesegelte/Berechnete Zeit und Platzierungen auf null bei DNF', () => {
    const dnf = byId('laser-2-dnf');
    expect(dnf.sailedSeconds).toBeNull();
    expect(dnf.correctedSeconds).toBeNull();
    expect(dnf.place).toBeNull();
    expect(dnf.placeCorrected).toBeNull();
  });

  it('ordnet den Zieleinlauf nach tatsächlicher Zeit (Platz 1 = FD, schnellste Realzeit)', () => {
    expect(byId('fd-1').place).toBe(1);
    expect(byId('laser-1').place).toBe(2);
    expect(byId('pirat-1').place).toBe(3);
  });

  it('kehrt die Reihenfolge bei der Yardstick-Wertung um (Platz 1 = Laser trotz langsamerer Realzeit)', () => {
    // FD ist real am schnellsten, aber nach Yardstick-Korrektur liegt der langsamere Laser vorne -
    // genau der Zweck der Handicap-Wertung.
    expect(byId('laser-1').placeCorrected).toBe(1);
    expect(byId('fd-1').placeCorrected).toBe(2);
    expect(byId('pirat-1').placeCorrected).toBe(3);
  });
});

describe('sortResults', () => {
  const results = computeResults(rows, START);

  it('sortBy=realtime ordnet nach Platz (Zielzeit), DNF ans Ende', () => {
    const sorted = sortResults(results, 'realtime');
    expect(sorted.map((r) => r.entryId)).toEqual(['fd-1', 'laser-1', 'pirat-1', 'laser-2-dnf']);
  });

  it('sortBy=corrected ordnet nach Yardstick-Platz, DNF ans Ende', () => {
    const sorted = sortResults(results, 'corrected');
    expect(sorted.map((r) => r.entryId)).toEqual(['laser-1', 'fd-1', 'pirat-1', 'laser-2-dnf']);
  });

  it('sortBy=class gruppiert nach Bootsklasse, innerhalb der Klasse nach Yardstick-Platz', () => {
    const sorted = sortResults(results, 'class');
    // Klassen alphabetisch: FD, Laser, Pirat - innerhalb Laser: laser-1 (Platz 1) vor DNF
    expect(sorted.map((r) => r.entryId)).toEqual(['fd-1', 'laser-1', 'laser-2-dnf', 'pirat-1']);
  });
});
