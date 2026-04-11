export default function ClockExplanation() {
  return (
    <section
      aria-labelledby="clock-explanation-heading"
      className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-6
                 transition-colors duration-200 hover:border-slate-700"
    >
      <h2
        id="clock-explanation-heading"
        className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 mb-5"
      >
        Wie funktioniert diese Uhr?
      </h2>

      <ul className="space-y-4 mb-6">
        {FEATURES.map(([title, desc]) => (
          <li key={title} className="flex gap-3">
            <span className="mt-[7px] shrink-0 w-1 h-1 rounded-full bg-red-500/60" aria-hidden="true" />
            <p className="text-sm text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-medium">{title}</span>
              {" — "}{desc}
            </p>
          </li>
        ))}
      </ul>

      {/* Zeitsynchronisation */}
      <div className="border-t border-slate-800 pt-5 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Zeitsynchronisation
        </p>

        <p className="text-sm text-slate-400 leading-relaxed">
          Diese Uhr basiert auf einer clientseitigen Zeitsynchronisation mit einer externen HTTP-API.
          Beim Initialisieren wird die aktuelle Serverzeit (<code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded text-xs">datetime</code>) geladen.
          Parallel dazu wird die lokale Systemzeit (<code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded text-xs">Date.now()</code>) vor
          und nach dem Request gemessen, um die Round-Trip-Latenz zu bestimmen.
        </p>

        {/* Formel */}
        <div className="rounded-lg bg-slate-950 border border-slate-800 px-4 py-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Offset-Berechnung</p>
          <code className="text-sm text-emerald-400" style={{ fontFamily: "Courier New, monospace" }}>
            Offset = Serverzeit + (Latenz / 2) − lokale Zeit
          </code>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">
          Dieser Offset wird anschließend auf alle weiteren Zeitberechnungen angewendet, sodass die
          Anzeige unabhängig von der lokalen Systemuhr möglichst exakt bleibt.
        </p>

        <p className="text-sm text-slate-400 leading-relaxed">
          Die analoge Uhr wird über <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded text-xs">requestAnimationFrame</code> aktualisiert,
          wodurch Stunden- und Minutenzeiger flüssig (bis zu ~60 FPS) laufen.
          Der Sekundenzeiger sowie die digitale Anzeige springen exakt an der NTP-Sekundengrenze
          via präzisem <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded text-xs">setTimeout</code>.
        </p>

        <p className="text-sm text-slate-400 leading-relaxed">
          Zusätzlich erfolgt in regelmäßigen Abständen (z. B. alle 60 Sekunden) eine erneute
          Synchronisation, um Drift durch Timerungenauigkeiten oder Systemabweichungen zu korrigieren.
        </p>

        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-800/60 pt-4">
          <span className="text-slate-400 font-medium">Hinweis:</span>{" "}
          Die Genauigkeit ist durch Netzwerk-Latenz, Jitter und Browser-Timing limitiert und liegt
          typischerweise im Bereich weniger Millisekunden. Eine echte NTP-Synchronisation ist im
          Browser nicht direkt möglich.
        </p>
      </div>

      {/* Was ist eine Sekunde? */}
      <div className="border-t border-slate-800 pt-5 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Was ist eine Sekunde?
        </p>

        <p className="text-sm text-slate-400 leading-relaxed">
          Die Sekunde ist seit 1967 über das Cäsium-133-Atom definiert — nicht mehr über die
          Erdumlaufbahn oder den Sonnentag. Ein Cäsiumatom wechselt unter bestimmten Bedingungen
          seinen Energiezustand mit einer extrem stabilen Frequenz. Genau diese Eigenschaft
          macht es zur perfekten Zeitreferenz.
        </p>

        {/* Formel */}
        <div className="rounded-lg bg-slate-950 border border-slate-800 px-4 py-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">SI-Definition seit 1967</p>
          <code className="text-sm text-emerald-400" style={{ fontFamily: "Courier New, monospace" }}>
            1 Sekunde = 9.192.631.770 Schwingungen des Cäsium-133-Atoms
          </code>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">
          Konkret misst eine Atomuhr die sogenannte Hyperfeinstruktur-Übergangsfrequenz des
          Cäsium-133-Atoms im Grundzustand. Das Atom wird mit Mikrowellenstrahlung bestrahlt —
          trifft die Frequenz exakt 9.192.631.770 Hz, wechselt das Atom seinen Spinzustand.
          Die Uhr zählt diese Übergänge und leitet daraus die Zeit ab.
        </p>

        <p className="text-sm text-slate-400 leading-relaxed">
          Diese Frequenz ist universell konstant: unabhängig von Temperatur, Druck, Ort oder
          Beobachter. Beste Atomuhren weichen weniger als{" "}
          <span className="text-slate-200 font-medium">1 Sekunde in 300 Millionen Jahren</span> ab.
          Über das globale NTP-Netzwerk wird diese Präzision bis in Browser und Smartphones
          übertragen — mit einer Restungenauigkeit von typischerweise wenigen Millisekunden.
        </p>
      </div>

      {/* Zukunft der Sekunde */}
      <div className="border-t border-slate-800 pt-5 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Die Sekunde der Zukunft — Optische Atomuhren
        </p>

        <p className="text-sm text-slate-400 leading-relaxed">
          Die Cäsium-Atomuhr arbeitet im Mikrowellenbereich (~9 GHz). Neuere{" "}
          <span className="text-slate-200 font-medium">optische Atomuhren</span> nutzen stattdessen
          sichtbares Laserlicht — und sind dadurch um den Faktor{" "}
          <span className="text-slate-200 font-medium">100 bis 1.000 mal genauer</span>.
          Das Prinzip ist dasselbe: Ein Atom schwingt, die Uhr zählt. Aber die Frequenz ist
          dramatisch höher.
        </p>

        {/* Vergleich Frequenzen */}
        <div className="rounded-lg bg-slate-950 border border-slate-800 px-4 py-3 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Frequenzvergleich</p>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Cäsium-133 (Mikrowelle)</span>
            <code className="text-slate-300" style={{ fontFamily: "Courier New, monospace" }}>~9,2 GHz</code>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Strontium-87 (Laser, rot)</span>
            <code className="text-emerald-400" style={{ fontFamily: "Courier New, monospace" }}>~429 THz</code>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Ytterbium-171 (Laser, violett)</span>
            <code className="text-emerald-400" style={{ fontFamily: "Courier New, monospace" }}>~518 THz</code>
          </div>
          <p className="text-[10px] text-slate-600 pt-1">
            Höhere Frequenz = mehr Schwingungen pro Sekunde = feinere Auflösung = geringere Unsicherheit
          </p>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">
          Bei einer <span className="text-slate-200 font-medium">Strontium-Gitteruhr</span> werden
          tausende Strontium-Atome in einem sogenannten optischen Gitter eingefangen — einem
          Muster aus gekreuzten Laserstrahlen, das die Atome wie Eier in einer Schachtel festhält.
          Ein weiterer, hochpräziser Laser regt den Quantenübergang an. Die Uhr misst, wie genau
          dieser Laser die Resonanzfrequenz trifft.
        </p>

        <p className="text-sm text-slate-400 leading-relaxed">
          Das technische Kernproblem war lange: Wie misst man 10<sup>14</sup> Schwingungen pro Sekunde?
          Die Lösung ist der{" "}
          <span className="text-slate-200 font-medium">Frequenzkamm</span> (Nobel Prize 2005,
          Theodor Hänsch) — ein Laser, der ein ganzes Spektrum gleichmäßig verteilter Frequenzen
          erzeugt und so optische Frequenzen mit Mikrowellen-Referenzen verknüpft.
        </p>

        {/* Genauigkeit */}
        <div className="rounded-lg bg-slate-950 border border-slate-800 px-4 py-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Genauigkeit im Vergleich</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Cäsium-Atomuhr</span>
              <span className="text-slate-300">1 s Abweichung in ~300 Mio. Jahren</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Optische Gitteruhr</span>
              <span className="text-emerald-400">1 s Abweichung in ~15–30 Mrd. Jahren</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">
          Das Alter des Universums beträgt ca. 13,8 Milliarden Jahre — eine optische Atomuhr
          hätte seit dem Urknall weniger als eine Sekunde verloren.
        </p>

        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-800/60 pt-4">
          <span className="text-slate-400 font-medium">Neudefinition geplant:</span>{" "}
          Das internationale Komitee für Maß und Gewicht (CIPM) arbeitet an einer Neudefinition
          der Sekunde auf Basis optischer Uhren — voraussichtlich um{" "}
          <span className="text-slate-300">2030</span>. Dann wird die Sekunde nicht mehr durch
          Cäsium, sondern durch einen optischen Übergang definiert sein.
        </p>
      </div>
    </section>
  );
}

const FEATURES: [string, string][] = [
  [
    "Kein setInterval — kein Drift",
    "Jeder Tick berechnet delay = 1000 − (getNtpNow() % 1000): die exakte Restzeit bis zur nächsten NTP-Sekunden-Grenze.",
  ],
  [
    "Tab-Wechsel (iOS Safari, Android)",
    "visibilitychange resynchronisiert den Timer sofort beim Zurückkehren. Kein Sprung, kein verpasster Tick.",
  ],
  [
    "GPU-Compositor-Thread",
    "Zeiger nutzen CSS-Transforms (will-change: transform) statt SVG-Attribute — Animationen laufen auf dem Compositor, nicht dem Main-Thread.",
  ],
  [
    "Keine React-Re-Renders",
    "Zeiger, Zeit und Timestamp werden direkt über DOM-Refs gesetzt. React rendert nach dem Mount nicht mehr neu.",
  ],
  [
    "Zeitzone via Intl.DateTimeFormat",
    "Alle Anzeigen nutzen Europe/Vienna. Sommer- und Winterzeit werden automatisch korrekt berechnet.",
  ],
];

