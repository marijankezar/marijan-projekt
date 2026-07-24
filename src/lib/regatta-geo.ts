export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface TrackPoint {
  lat: number;
  lng: number;
  speed: number | null;
  timestamp: string; // ISO
}

export interface TrackStats {
  distanceMeters: number;
  durationSeconds: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
}

/** Distanz/Dauer/Geschwindigkeit aus einer zeitlich sortierten Punktreihe einer Session. */
export function computeTrackStats(points: TrackPoint[]): TrackStats {
  if (points.length === 0) {
    return { distanceMeters: 0, durationSeconds: 0, avgSpeedMps: 0, maxSpeedMps: 0 };
  }

  let distanceMeters = 0;
  let maxSpeedMps = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const segmentDistance = haversineMeters(prev, curr);
    distanceMeters += segmentDistance;

    const deviceSpeed = curr.speed ?? null;
    if (deviceSpeed != null) {
      maxSpeedMps = Math.max(maxSpeedMps, deviceSpeed);
    } else {
      // Fallback, falls das Gerät keine Geschwindigkeit liefert: aus Distanz/Zeit ableiten
      const dtSeconds = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      if (dtSeconds > 0) maxSpeedMps = Math.max(maxSpeedMps, segmentDistance / dtSeconds);
    }
  }

  const durationSeconds =
    (new Date(points[points.length - 1].timestamp).getTime() - new Date(points[0].timestamp).getTime()) / 1000;
  const avgSpeedMps = durationSeconds > 0 ? distanceMeters / durationSeconds : 0;

  return { distanceMeters, durationSeconds, avgSpeedMps, maxSpeedMps };
}

// ============================================================
// Ziellinien-Erkennung
//
// Bei ~10m Linienlänge reicht eine einfache lokale (äquirektanguläre) Projektion
// um den Linien-Mittelpunkt statt voller sphärischer Geometrie - konsistent mit
// dem übrigen Haversine-Only-Ansatz in dieser Datei.
// ============================================================

export interface TimedLatLng extends LatLng {
  timestamp: number; // epoch ms
}

export interface FinishLineDef {
  a: LatLng;
  b: LatLng;
}

interface XY {
  x: number;
  y: number;
}

function toLocalXY(point: LatLng, ref: LatLng): XY {
  const latRad = (ref.lat * Math.PI) / 180;
  return {
    x: ((point.lng - ref.lng) * Math.PI * EARTH_RADIUS_M * Math.cos(latRad)) / 180,
    y: ((point.lat - ref.lat) * Math.PI * EARTH_RADIUS_M) / 180,
  };
}

/** Vorzeichen: auf welcher Seite der Linie A->B liegt P (positiv/negativ/0 = auf der Linie). */
export function sideOfLine(p: XY, a: XY, b: XY): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/**
 * Schnittpunkt zweier Strecken (nicht unendlicher Linien) via Parametrisierung
 * P = p1 + t*(p2-p1), Q = q1 + u*(q2-q1). Nur ein Treffer, wenn t UND u in [0,1] liegen,
 * d.h. der Schnittpunkt tatsächlich innerhalb beider Strecken liegt.
 */
function segmentIntersection(p1: XY, p2: XY, q1: XY, q2: XY): { t: number; u: number } | null {
  const r = { x: p2.x - p1.x, y: p2.y - p1.y };
  const s = { x: q2.x - q1.x, y: q2.y - q1.y };
  const rxs = r.x * s.y - r.y * s.x;
  if (rxs === 0) return null; // parallel oder kollinear

  const qp = { x: q1.x - p1.x, y: q1.y - p1.y };
  const t = (qp.x * s.y - qp.y * s.x) / rxs;
  const u = (qp.x * r.y - qp.y * r.x) / rxs;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, u };
}

export interface FinishCrossingResult {
  crossed: boolean;
  /** Interpolierte Kreuzungszeit (epoch ms), nur gesetzt wenn crossed=true. */
  finishAt?: number;
}

/**
 * Erkennt, ob die Bewegung von `prev` nach `next` die Ziellinie in Zielrichtung kreuzt.
 *
 * WICHTIG: Punkt A und B stecken die Ziellinie QUER zum Kurs ab (nicht die Fahrtrichtung
 * selbst!). Die als "Zieleinlauf" gewertete Kreuzungsrichtung ist die Seite LINKS der
 * Strecke A->B, wenn man von A in Richtung B blickt (Rechte-Hand-Regel: positives
 * Kreuzprodukt). Der FinishLineEditor zeigt dafür einen Richtungspfeil auf der Karte an.
 * Eine Kreuzung zählt nur in dieser Richtung - das verhindert, dass eine Rückwärtsfahrt
 * (z.B. vor dem Start, oder Zurücksegeln nach dem Ziel) fälschlich als Zieleinlauf gewertet
 * wird. Zusätzlich muss der Schnittpunkt innerhalb der ca. 10m langen Strecke A-B liegen
 * (nicht nur auf der unendlich verlängerten Linie).
 */
export function detectFinishCrossing(
  prev: TimedLatLng,
  next: TimedLatLng,
  line: FinishLineDef
): FinishCrossingResult {
  const ref: LatLng = { lat: (line.a.lat + line.b.lat) / 2, lng: (line.a.lng + line.b.lng) / 2 };
  const p1 = toLocalXY(prev, ref);
  const p2 = toLocalXY(next, ref);
  const a = toLocalXY(line.a, ref);
  const b = toLocalXY(line.b, ref);

  const sidePrev = sideOfLine(p1, a, b);
  const sideNext = sideOfLine(p2, a, b);
  if (!(sidePrev < 0 && sideNext > 0)) {
    return { crossed: false };
  }

  const intersection = segmentIntersection(p1, p2, a, b);
  if (!intersection) {
    return { crossed: false };
  }

  const finishAt = prev.timestamp + intersection.t * (next.timestamp - prev.timestamp);
  return { crossed: true, finishAt };
}
