'use client';

import dynamic from 'next/dynamic';

const GoldPageClient = dynamic(() => import('./GoldPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      <div className="flex flex-col items-center gap-3 text-amber-500">
        <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-sm text-gray-500 dark:text-gray-400">Gold wird geladen…</span>
      </div>
    </div>
  ),
});

export default function GoldPage() {
  return <GoldPageClient />;
}
