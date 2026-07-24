import { getRegattaSession } from '@/lib/regatta-session';
import {
  regattaBus,
  activeSessionSnapshots,
  sseMessage,
  type RegattaPointEvent,
  type RegattaSessionEndEvent,
} from '@/lib/regatta-broadcast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-Sent-Events-Stream: initialer Snapshot aller aktiven Boote, danach Live-Diffs.
 * Admins sehen alle aktiven Tracks; normale Nutzer ausschließlich ihre eigenen.
 */
export async function GET(request: Request) {
  const session = await getRegattaSession();
  if (!session.user) {
    return new Response('Nicht autorisiert', { status: 401 });
  }
  const isAdmin = session.user.isAdmin;
  const ownPersonId = session.user.id;
  const canSee = (personId: string) => isAdmin || personId === ownPersonId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const snapshot = Array.from(activeSessionSnapshots.values()).filter((p) => canSee(p.personId));
      controller.enqueue(encoder.encode(sseMessage('snapshot', snapshot)));

      const onPoint = (event: RegattaPointEvent) => {
        if (!canSee(event.personId)) return;
        controller.enqueue(encoder.encode(sseMessage('point', event)));
      };
      const onSessionEnd = (event: RegattaSessionEndEvent) => {
        if (!canSee(event.personId)) return;
        controller.enqueue(encoder.encode(sseMessage('sessionEnd', event)));
      };
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 25000);

      regattaBus.on('point', onPoint);
      regattaBus.on('sessionEnd', onSessionEnd);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        regattaBus.off('point', onPoint);
        regattaBus.off('sessionEnd', onSessionEnd);
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
