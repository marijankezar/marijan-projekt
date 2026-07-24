'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface RegattaMapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  /** false = statischer Punkt ohne Puls-Animation, z.B. Start/Ende eines abgeschlossenen Tracks. */
  pulse?: boolean;
}

export interface RegattaLatLng {
  lat: number;
  lng: number;
}

interface RegattaMapProps {
  markers: RegattaMapMarker[];
  trails?: Record<string, [number, number][]>;
  focusId?: string | null;
  height?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  /** Re-fit die Karte bei jeder Änderung von markers/trails, statt nur einmalig beim Mount. */
  autoFit?: boolean;
  /** Ziellinie Punkt A -> Punkt B (Fahrtrichtung des Zieleinlaufs), als gestrichelte Linie eingeblendet. */
  finishLine?: { a: RegattaLatLng; b: RegattaLatLng } | null;
  /** Wenn gesetzt, meldet jeder Kartenklick die Koordinate zurück (z.B. Ziellinien-Editor). */
  onMapClick?: (latlng: RegattaLatLng) => void;
}

function ClickHandler({ onClick }: { onClick: (latlng: RegattaLatLng) => void }) {
  useMapEvent('click', (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }));
  return null;
}

function finishLineMarkerIcon(label: string) {
  return L.divIcon({
    className: 'regatta-finish-marker',
    html: `<span class="regatta-finish-marker-dot">${label}</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/**
 * Mittelpunkt + Spitze eines kurzen Pfeils, der die als Zieleinlauf gewertete
 * Kreuzungsrichtung anzeigt: die Seite LINKS der Strecke A->B (Blickrichtung A nach B),
 * siehe src/lib/regatta-geo.ts detectFinishCrossing für die exakte Konvention.
 */
function finishDirectionArrow(a: RegattaLatLng, b: RegattaLatLng) {
  const mid: RegattaLatLng = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  // 90°-CCW-Rotation von (dLng, dLat) in lng/lat-Näherung -> Richtung "links von A->B"
  const tip: RegattaLatLng = { lat: mid.lat + dLng * 0.6, lng: mid.lng - dLat * 0.6 };
  return { mid, tip };
}

function bearingDegrees(a: RegattaLatLng, b: RegattaLatLng): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function arrowIcon(bearing: number) {
  return L.divIcon({
    className: 'regatta-finish-arrow',
    html: `<span class="regatta-finish-arrow-glyph" style="transform: rotate(${bearing}deg)">&#8593;</span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const AUSTRIA_CENTER: [number, number] = [47.5, 14.5];

function markerIcon(color: string, pulse: boolean) {
  const pulseHtml = pulse ? `<span class="regatta-marker-pulse" style="background:${color}"></span>` : '';
  return L.divIcon({
    className: 'regatta-marker',
    html: `${pulseHtml}<span class="regatta-marker-dot" style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

interface MapControllerProps {
  markers: RegattaMapMarker[];
  trails: Record<string, [number, number][]>;
  focusId?: string | null;
  autoFit?: boolean;
}

/**
 * Zwei sich gegenseitig ausschließende Fit-Modi:
 * - Standard: fittet EINMALIG beim ersten Laden (Live-Tracking/Live-Karte sollen sich
 *   nicht bei jedem neuen Punkt neu zentrieren), danach nur noch focusId-Flüge.
 * - autoFit: fittet bei JEDER Änderung neu (Verlauf-Vergleichskarte, wo die Auswahl
 *   sich aktiv ändert und der Ausschnitt immer alle sichtbaren Tracks zeigen soll).
 */
function MapController({ markers, trails, focusId, autoFit }: MapControllerProps) {
  const map = useMap();
  const didInitialFit = useRef(false);

  useEffect(() => {
    if (autoFit) return;
    if (didInitialFit.current || markers.length === 0) return;
    didInitialFit.current = true;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 15);
    } else {
      map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), { padding: [40, 40] });
    }
  }, [markers, map, autoFit]);

  useEffect(() => {
    if (!autoFit) return;
    // Bounds aus Markern UND allen Trail-Punkten (nicht nur Markern) - ein Track kann
    // weit vom Startpunkt abweichen. latLngBounds([]) bleibt "invalid" bis befüllt.
    const bounds = L.latLngBounds([]);
    markers.forEach((m) => bounds.extend([m.lat, m.lng]));
    Object.values(trails).forEach((path) => path.forEach((pt) => bounds.extend(pt)));
    if (!bounds.isValid()) return;
    const totalPoints = markers.length + Object.values(trails).reduce((n, p) => n + p.length, 0);
    if (totalPoints === 1) {
      map.setView(bounds.getCenter(), 15);
    } else {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, trails, autoFit, map]);

  useEffect(() => {
    if (!focusId) return;
    const marker = markers.find((m) => m.id === focusId);
    if (marker) map.flyTo([marker.lat, marker.lng], 16, { duration: 0.8 });
  }, [focusId, markers, map]);

  return null;
}

export default function RegattaMap({
  markers,
  trails = {},
  focusId,
  height = '100%',
  defaultCenter = AUSTRIA_CENTER,
  defaultZoom = 7,
  autoFit = false,
  finishLine = null,
  onMapClick,
}: RegattaMapProps) {
  return (
    <div style={{ height, width: '100%' }} className="overflow-hidden rounded-2xl">
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.entries(trails).map(([id, path]) =>
          path.length > 1 ? (
            <Polyline
              key={id}
              positions={path}
              pathOptions={{ color: markers.find((m) => m.id === id)?.color ?? '#3b82f6', weight: 3, opacity: 0.7 }}
            />
          ) : null
        )}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(m.color, m.pulse ?? true)} />
        ))}
        {finishLine && (
          <>
            <Polyline
              positions={[
                [finishLine.a.lat, finishLine.a.lng],
                [finishLine.b.lat, finishLine.b.lng],
              ]}
              pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.9, dashArray: '8 6' }}
            />
            <Marker position={[finishLine.a.lat, finishLine.a.lng]} icon={finishLineMarkerIcon('A')} />
            <Marker position={[finishLine.b.lat, finishLine.b.lng]} icon={finishLineMarkerIcon('B')} />
            {(() => {
              const { mid, tip } = finishDirectionArrow(finishLine.a, finishLine.b);
              return (
                <>
                  <Polyline
                    positions={[
                      [mid.lat, mid.lng],
                      [tip.lat, tip.lng],
                    ]}
                    pathOptions={{ color: '#ef4444', weight: 2, opacity: 0.8 }}
                  />
                  <Marker position={[tip.lat, tip.lng]} icon={arrowIcon(bearingDegrees(mid, tip))} />
                </>
              );
            })()}
          </>
        )}
        {onMapClick && <ClickHandler onClick={onMapClick} />}
        <MapController markers={markers} trails={trails} focusId={focusId} autoFit={autoFit} />
      </MapContainer>
    </div>
  );
}
