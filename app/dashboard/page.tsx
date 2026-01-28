import StundenbuchungenList from "app/components/StundenbuchungenList";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Stundenbuchungen
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Übersicht aller erfassten Arbeitsstunden
          </p>
        </div>
        <Link
          href="/dashboard/eintragen"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <PlusCircle className="w-5 h-5" />
          Neuer Eintrag
        </Link>
      </div>

      {/* Main Content */}
      <StundenbuchungenList />
    </div>
  );
}
