'use client';

export default function MyFooter() {
  return (
    <footer className="bg-gray-100 dark:bg-black py-6 mt-10 border-t border-gray-200 dark:border-gray-800">
      <div className="animated-line-wrapper">
        <div className="animated-line"></div>
      </div>

      <div className="text-center py-4">
        <a
          href="https://kezar.at"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-colors"
        >
          2026 Powered by Marijan Kežar BSc | www.kezar.at
        </a>
      </div>

      <div className="animated-line-wrapper">
        <div className="animated-line"></div>
      </div>
    </footer>
  );
}
