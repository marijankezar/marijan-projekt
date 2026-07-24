/**
 * Kuratierte, CVD-geprüfte kategoriale Palette (siehe dataviz-Skill,
 * references/palette.md) statt eines frei generierten Farbtons — ein
 * simpler Hash-auf-Hue kann zwei verschiedene Personen sehr ähnliche
 * Farben zuweisen (z.B. hsl(145) vs. hsl(148), beides Grün).
 */
const CATEGORICAL_PALETTE = [
  '#2a78d6', // blau
  '#008300', // grün
  '#e87ba4', // magenta
  '#eda100', // gelb
  '#1baf7a', // aqua
  '#eb6834', // orange
  '#4a3aa7', // violett
  '#e34948', // rot
];

/** FNV-1a: einfacher Hash mit guter Streuung, vermeidet Clusterbildung bei ähnlichen UUIDs. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministische Marker-Farbe pro Person: gleiche Person = immer gleiche Farbe. */
export function colorForPersonId(personId: string): string {
  return CATEGORICAL_PALETTE[hashString(personId) % CATEGORICAL_PALETTE.length];
}
