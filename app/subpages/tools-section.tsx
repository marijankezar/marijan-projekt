'use client';

import Link from 'next/link';

export default function ToolsSection() {
  return (
    <>
      <div className="relative my-6">
        <div className="living-line border-t-4 border-gray-600">
          <div className="scan-light"></div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Tools
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">
          Nützliche Werkzeuge & Features
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Atomuhr Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 p-6 flex flex-col gap-3">
            <Link href="/uhr" className="absolute inset-0 z-20 rounded-2xl" aria-label="Kežar Atomuhr öffnen" />

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-600/0 group-hover:from-emerald-500/5 group-hover:to-teal-600/5 transition-all duration-300 rounded-2xl" />

            <div className="relative z-10 flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M9 21h6"/>
                </svg>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </div>

            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Kežar Atomuhr
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Präzise Uhrzeit synchronisiert per NTP · Analog &amp; Digital · Epoch / Unix Timestamp Konverter
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-1.5 mt-1">
              {["NTP-Sync", "Analog", "Epoch Converter", "DST"].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative my-6">
        <div className="living-line border-t-4 border-gray-600">
          <div className="scan-light"></div>
        </div>
      </div>
    </>
  );
}
