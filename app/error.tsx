'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Etwas ist schiefgelaufen
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Ein unerwarteter Fehler ist aufgetreten.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
