'use client';

import Link from "next/link";

export default function MyHeder() {
  return (
    <footer className="bg-white dark:bg-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800">

      {/* Obere Linie – sehr geringer Abstand nach unten */}
      <div className="animated-line-wrapper mb-0.5">
        <div className="animated-line"></div>
      </div>

      {/* Hauptinhalt – minimaler vertikaler Innenabstand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        <div className="relative flex justify-between items-center h-10 sm:h-12">

          {/* Links: Navigation */}
          <div className="flex space-x-4 sm:space-x-6 text-sm sm:text-base">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Start
            </Link>
            <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Login
            </Link>
            <Link href="/birthday" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Sandro
            </Link>
          </div>

          {/* Mitte: Kezar-Zentrierung */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <a
              href="https://kezar.at"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm sm:text-base tracking-wide whitespace-nowrap transition-colors"
            >
              2026 kezar.at
            </a>
          </div>
        </div>
      </div>

      {/* Untere Linie – sehr geringer Abstand nach oben */}
      <div className="animated-line-wrapper mt-0.5">
        <div className="animated-line"></div>
      </div>

    </footer>
  );
}
