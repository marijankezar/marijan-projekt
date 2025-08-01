'use client';

import Link from "next/link";

export default function MyHeder() {
  return (
    <footer className="bg-black text-white">
      
      {/* Obere Linie – sehr geringer Abstand nach unten */}
      <div className="animated-line-wrapper mb-0.5">
        <div className="animated-line"></div>
      </div>

      {/* Hauptinhalt – minimaler vertikaler Innenabstand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        <div className="relative flex justify-between items-center h-10 sm:h-12">
          
          {/* Links: Navigation */}
          <div className="flex space-x-4 sm:space-x-6 text-sm sm:text-base">
            <Link href="/" className="hover:text-yellow-300 transition-colors">
              Start
            </Link>
            <Link href="/login" className="hover:text-yellow-300 transition-colors">
              Login
            </Link>
          </div>

          {/* Mitte: Kezar-Zentrierung */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <a
              href="https://kezar.at"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-white to-gray-300 animate-text-shimmer font-semibold text-sm sm:text-base tracking-wide whitespace-nowrap"
            >
              {new Date().getFullYear()} kezar.at
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
