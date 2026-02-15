import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h2>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Seite nicht gefunden
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Die angeforderte Seite existiert nicht.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
