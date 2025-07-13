'use client';

export default function MyHeder() {
  return (
    <footer className="bg-black py-6 mt-1">
      
      <div className="animated-line-wrapper">
        <div className="animated-line">
        </div>
      </div>

        <div className="text-center">
          <a
            href="https://kezar.at"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-white to-gray-300 animate-text-shimmer font-semibold text-sm sm:text-base tracking-wide"
          >
            {new Date().getFullYear()} Haeder
          </a>
        </div>

          <div className="animated-line-wrapper">
          <div className="animated-line"></div>
        </div>

    </footer>
  );
}
