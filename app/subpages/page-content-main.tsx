'use client';

import MovieList from './movie-component';

export default function MyMainContent() {
  return (
    <div className="mx-auto my-8 w-full max-w-4xl px-4 relative">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-8 shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-300/30 dark:bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-300/30 dark:bg-indigo-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Dobrodošli!
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
              Video arhiv družine Kežar
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hvala Matej za videomaterial
            </p>
          </div>
        </div>
      </div>

      {/* Horizontale Trennlinie */}
      <div className="relative my-6">
        <div className="living-line border-t-4 border-gray-600">
          <div className="scan-light"></div>
        </div>
      </div>

      {/* Video Liste */}
      <MovieList />

      {/* Horizontale Trennlinie */}
      <div className="relative my-6">
        <div className="living-line border-t-4 border-gray-600">
          <div className="scan-light"></div>
        </div>
      </div>
    </div>
  );
}
