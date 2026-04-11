/**
 * Zentrale NTP-Zeitbasis — einzige Zeitquelle für alle Uhr-Komponenten.
 *
 * Alle Komponenten rufen getNtpNow() statt Date.now() auf.
 *
 * Offset-Berechnung (klassisches NTP-Verfahren):
 *   t0 = lokale Zeit vor dem Request
 *   S  = Serverzeit aus der HTTP-Antwort
 *   t1 = lokale Zeit nach Empfang
 *   offset = S + (t1 − t0) / 2 − t1
 *
 * Glättung:
 *   Abweichung > 200 ms oder erste Sync → sofort übernehmen
 *   Abweichung ≤ 200 ms               → gewichteter Mittelwert (kein Sprung)
 *
 * Fallback: Netzwerkfehler → bestehender Offset bleibt, Retry in 60 s.
 *           Noch kein Sync → offset = 0 (lokale Zeit).
 */

const NTP_URL  = "https://worldtime.formality.de/api/timezone/Europe/Vienna";
const INTERVAL = 60_000;   // Resync alle 60 s
const TIMEOUT  = 3_000;    // Max. Wartezeit
const SMOOTH   = 200;      // Unter diesem Schwellwert: sanfte Korrektur

let offsetRef = 0;      // ms: NTP-Zeit − lokale Zeit
let synced    = false;

/** NTP-korrigierte Zeit in ms — Ersatz für Date.now() überall */
export function getNtpNow(): number {
  return Date.now() + offsetRef;
}

async function sync(): Promise<void> {
  const t0   = Date.now();
  const ctrl = new AbortController();
  const tout = setTimeout(() => ctrl.abort(), TIMEOUT);

  try {
    const res = await fetch(NTP_URL, { signal: ctrl.signal });
    clearTimeout(tout);
    if (!res.ok) return;

    const data: { datetime: string } = await res.json();
    const t1       = Date.now();
    const serverMs = new Date(data.datetime).getTime();
    if (!Number.isFinite(serverMs)) return;

    const measured = serverMs + (t1 - t0) / 2 - t1;
    const diff     = Math.abs(measured - offsetRef);

    if (!synced || diff > SMOOTH) {
      offsetRef = measured;           // erste Sync oder großer Drift → sofort
    } else {
      offsetRef = offsetRef * 0.7 + measured * 0.3;  // sanfte Angleichung
    }
    synced = true;
  } catch {
    clearTimeout(tout);
    // Fehler → offset unverändert, nächster Retry in 60 s
  }
}

if (typeof window !== "undefined") {
  sync();
  setInterval(sync, INTERVAL);
}
