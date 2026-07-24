import regattaPool from '@/db-regatta';
import {
  regattaBus,
  activeSessionSnapshots,
  sseMessage,
  type RegattaPointEvent,
  type RegattaSessionEndEvent,
  type RegattaFinishEvent,
} from '@/lib/regatta-broadcast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Öffentlicher, event-gescopter Live-Stream (kein Login nötig) für die Zuschauer-Ansicht.
 * Sichtbarkeit wird über die zur Veranstaltung gehörenden Meldungs-IDs bestimmt, nicht über
 * eine Session wie beim geschützten /api/regatta/live. Die Menge der gültigen entryIds wird
 * einmalig beim Verbindungsaufbau geladen - neu hinzukommende Meldungen während eine laufende
 * Verbindung offen ist, tauchen erst bei einem Reconnect auf (in der Praxis unkritisch, da
 * Meldeschluss i.d.R. vor Wettfahrtbeginn liegt).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const entryRows = await regattaPool.query('SELECT id FROM entry WHERE event_id = $1', [id]);
  const entryIds = new Set<string>(entryRows.rows.map((r) => r.id));
  const canSee = (entryId: string | null | undefined) => !!entryId && entryIds.has(entryId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const snapshot = Array.from(activeSessionSnapshots.values()).filter((p) => canSee(p.entryId));
      controller.enqueue(encoder.encode(sseMessage('snapshot', snapshot)));

      const onPoint = (event: RegattaPointEvent) => {
        if (!canSee(event.entryId)) return;
        controller.enqueue(encoder.encode(sseMessage('point', event)));
      };
      // sessionEnd trägt keine entryId - wird ungefiltert weitergeleitet (enthält nur eine
      // UUID, kein Informationsrisiko; Clients entfernen ohnehin nur bereits bekannte IDs).
      const onSessionEnd = (event: RegattaSessionEndEvent) => {
        controller.enqueue(encoder.encode(sseMessage('sessionEnd', event)));
      };
      const onFinish = (event: RegattaFinishEvent) => {
        if (!canSee(event.entryId)) return;
        controller.enqueue(encoder.encode(sseMessage('finish', event)));
      };
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 25000);

      regattaBus.on('point', onPoint);
      regattaBus.on('sessionEnd', onSessionEnd);
      regattaBus.on('finish', onFinish);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        regattaBus.off('point', onPoint);
        regattaBus.off('sessionEnd', onSessionEnd);
        regattaBus.off('finish', onFinish);
        try {
          controller.close();
        } catch {
          // Stream bereits geschlossen
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
