import { describe, it, expect } from 'vitest';
import { haversineMeters, computeTrackStats, detectFinishCrossing, type FinishLineDef } from './regatta-geo';

describe('haversineMeters', () => {
  it('gibt 0 für identische Punkte zurück', () => {
    expect(haversineMeters({ lat: 47.8, lng: 13.55 }, { lat: 47.8, lng: 13.55 })).toBe(0);
  });

  it('berechnet eine plausible Distanz für ~1km Nord-Süd', () => {
    // 1 Grad Breite ≈ 111.32km -> 0.009 Grad ≈ 1002m
    const d = haversineMeters({ lat: 47.8, lng: 13.55 }, { lat: 47.809, lng: 13.55 });
    expect(d).toBeGreaterThan(950);
    expect(d).toBeLessThan(1050);
  });
});

describe('computeTrackStats', () => {
  it('liefert Nullwerte für leere Punktreihe', () => {
    expect(computeTrackStats([])).toEqual({
      distanceMeters: 0,
      durationSeconds: 0,
      avgSpeedMps: 0,
      maxSpeedMps: 0,
    });
  });

  it('berechnet Distanz/Dauer/Geschwindigkeit über mehrere Punkte', () => {
    const stats = computeTrackStats([
      { lat: 47.8, lng: 13.55, speed: 2, timestamp: '2026-01-01T10:00:00.000Z' },
      { lat: 47.801, lng: 13.55, speed: 3, timestamp: '2026-01-01T10:01:00.000Z' },
      { lat: 47.802, lng: 13.55, speed: 4, timestamp: '2026-01-01T10:02:00.000Z' },
    ]);
    expect(stats.durationSeconds).toBe(120);
    expect(stats.distanceMeters).toBeGreaterThan(0);
    expect(stats.maxSpeedMps).toBe(4);
    expect(stats.avgSpeedMps).toBeCloseTo(stats.distanceMeters / 120, 6);
  });
});

describe('detectFinishCrossing', () => {
  // Ziellinie ~15m lang, quer zum Kurs (Ost-West) bei lat 47.8. Boote kreuzen sie, indem
  // sie über diese Breite fahren - die Linie A->B selbst ist NICHT die Fahrtrichtung,
  // sondern steht quer dazu (siehe Doku in regatta-geo.ts).
  const line: FinishLineDef = {
    a: { lat: 47.8, lng: 13.5499 },
    b: { lat: 47.8, lng: 13.5501 },
  };

  it('erkennt eine Kreuzung in Zielrichtung (Süd -> Nord) innerhalb der Linie', () => {
    const prev = { lat: 47.7999, lng: 13.55, timestamp: 1000 };
    const next = { lat: 47.8001, lng: 13.55, timestamp: 2000 };
    const result = detectFinishCrossing(prev, next, line);
    expect(result.crossed).toBe(true);
    expect(result.finishAt).toBeGreaterThan(1000);
    expect(result.finishAt).toBeLessThan(2000);
  });

  it('interpoliert die Zielzeit proportional zum Kreuzungspunkt', () => {
    // Linie liegt (in Süd-Nord-Richtung) exakt in der Mitte zwischen prev und next
    const prev = { lat: 47.7998, lng: 13.55, timestamp: 0 };
    const next = { lat: 47.8002, lng: 13.55, timestamp: 1000 };
    const result = detectFinishCrossing(prev, next, line);
    expect(result.crossed).toBe(true);
    expect(result.finishAt).toBeCloseTo(500, -1);
  });

  it('ignoriert eine Kreuzung in falscher Richtung (Rückwärtsfahrt Nord -> Süd)', () => {
    const prev = { lat: 47.8001, lng: 13.55, timestamp: 1000 };
    const next = { lat: 47.7999, lng: 13.55, timestamp: 2000 };
    const result = detectFinishCrossing(prev, next, line);
    expect(result.crossed).toBe(false);
  });

  it('ignoriert eine Kreuzung außerhalb der ca. 15m langen Strecke A-B', () => {
    // Kreuzt zwar die unendlich verlängerte Linie (gleiche Breite), aber weit östlich von B
    const prev = { lat: 47.7999, lng: 13.6, timestamp: 1000 };
    const next = { lat: 47.8001, lng: 13.6, timestamp: 2000 };
    const result = detectFinishCrossing(prev, next, line);
    expect(result.crossed).toBe(false);
  });

  it('erkennt keine Kreuzung, wenn beide Punkte auf derselben (südlichen) Seite liegen', () => {
    const prev = { lat: 47.7995, lng: 13.55, timestamp: 1000 };
    const next = { lat: 47.7998, lng: 13.55, timestamp: 2000 };
    const result = detectFinishCrossing(prev, next, line);
    expect(result.crossed).toBe(false);
  });

  it('erkennt keine Kreuzung bei Bewegung parallel/entlang der Ziellinie', () => {
    // Boot fährt südlich der Linie entlang (Ost-West), kreuzt sie nie
    const prev = { lat: 47.79, lng: 13.5498, timestamp: 1000 };
    const next = { lat: 47.79, lng: 13.5502, timestamp: 2000 };
    const result = detectFinishCrossing(prev, next, line);
    expect(result.crossed).toBe(false);
  });
});
