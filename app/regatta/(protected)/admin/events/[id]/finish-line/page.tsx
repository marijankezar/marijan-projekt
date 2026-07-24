'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, MapPinned } from 'lucide-react';
import FinishLineEditor, { useFinishLineEditorState } from '../../../../../../components/regatta/FinishLineEditor';
import type { RegattaLatLng } from '../../../../../../components/regatta/RegattaMap';

const RegattaMap = dynamic(() => import('../../../../../../components/regatta/RegattaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

interface EventSummary {
  id: string;
  name: string;
}

export default function FinishLinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [initial, setInitial] = useState<{ a: RegattaLatLng; b: RegattaLatLng } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [eventRes, lineRes] = await Promise.all([
        fetch(`/api/regatta/events/${id}`),
        fetch(`/api/regatta/events/${id}/finish-line`),
      ]);
      if (eventRes.ok) setEvent(await eventRes.json());
      if (lineRes.ok) {
        const body = await lineRes.json();
        if (body.finishLine) {
          setInitial({
            a: { lat: body.finishLine.pointALat, lng: body.finishLine.pointALng },
            b: { lat: body.finishLine.pointBLat, lng: body.finishLine.pointBLng },
          });
        }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return <FinishLinePageContent eventId={id} eventName={event?.name ?? ''} initial={initial} />;
}

function FinishLinePageContent({
  eventId,
  eventName,
  initial,
}: {
  eventId: string;
  eventName: string;
  initial: { a: RegattaLatLng; b: RegattaLatLng } | null;
}) {
  const state = useFinishLineEditorState(initial);
  const { a, b, target, setA, setB } = state;

  async function handleSave(line: { a: RegattaLatLng; b: RegattaLatLng }) {
    const res = await fetch(`/api/regatta/events/${eventId}/finish-line`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointA: line.a, pointB: line.b }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Speichern fehlgeschlagen');
    }
  }

  return (
    <div>
      <Link
        href="/regatta/admin/events"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Veranstaltungen
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
        <MapPinned className="w-6 h-6 text-blue-500" />
        Ziellinie {eventName && `— ${eventName}`}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="h-[60vh] lg:h-[70vh]">
          <RegattaMap
            markers={[]}
            finishLine={a && b ? { a, b } : null}
            onMapClick={(latlng) => (target === 'a' ? setA(latlng) : setB(latlng))}
            defaultZoom={13}
          />
        </div>
        <FinishLineEditor {...state} onSave={handleSave} />
      </div>
    </div>
  );
}
