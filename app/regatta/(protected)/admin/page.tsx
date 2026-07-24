import Link from 'next/link';
import { CalendarDays, Sailboat, ArrowRight } from 'lucide-react';

const CARDS = [
  {
    href: '/regatta/admin/events',
    icon: CalendarDays,
    title: 'Veranstaltungen',
    description: 'Anlegen, bearbeiten, Status setzen, Ziellinie definieren, Meldungen einsehen',
  },
  {
    href: '/regatta/admin/boat-classes',
    icon: Sailboat,
    title: 'Bootsklassen',
    description: 'Klassen mit Yardstickzahl für die Wertung verwalten',
  },
];

export default function RegattaAdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Verwaltung</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="mt-4 font-semibold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
