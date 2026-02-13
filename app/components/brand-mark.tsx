'use client';

export default function BrandMark() {
  return (
    <a
      href="https://kezar.at"
      target="_blank"
      rel="noopener noreferrer"
      className="bm"
      aria-label="Marijan Kežar - Web Development"
    >
      {/* Ring */}
      <span className="bm-ring" />

      {/* Badge */}
      <span className="bm-inner">
        {/* Background: Marijan */}
        <span className="bm-bg-name">Marijan</span>

        {/* Foreground: KEŽAR */}
        <span className="bm-fg-name">
          <span className="bm-fg-k">K</span>
          <span className="bm-fg-e">E</span>
          <span className="bm-fg-z">Ž</span>
          <span className="bm-fg-a">A</span>
          <span className="bm-fg-r">R</span>
        </span>
      </span>

      {/* Hover underline */}
      <span className="bm-line" />

      {/* Accent dot */}
      <span className="bm-dot" />

      <style jsx>{`
        .bm {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bm:hover {
          transform: translateY(-2px);
        }

        /* ---- Ring ---- */
        .bm-ring {
          position: absolute;
          inset: -3px;
          border-radius: 16px;
          border: 1.5px solid rgba(59, 130, 246, 0.15);
          transition: all 0.5s ease;
          pointer-events: none;
        }

        .bm:hover .bm-ring {
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.1);
        }

        /* ---- Badge ---- */
        .bm-inner {
          position: relative;
          z-index: 2;
          width: 64px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #1e293b, #0f172a);
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.15),
            0 1px 2px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.5s ease;
          overflow: hidden;
        }

        .bm:hover .bm-inner {
          box-shadow:
            0 4px 16px rgba(59, 130, 246, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        /* ---- Background text: Marijan ---- */
        .bm-bg-name {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-geist-sans), sans-serif;
          font-size: 0.5rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.18);
          letter-spacing: 0.12em;
          white-space: nowrap;
          z-index: 1;
          transition: all 0.5s ease;
          pointer-events: none;
        }

        .bm:hover .bm-bg-name {
          color: rgba(255, 255, 255, 0.3);
        }

        /* ---- Foreground text: KEŽAR ---- */
        .bm-fg-name {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: baseline;
          margin-top: 4px;
          font-family: var(--font-geist-sans), sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1;
        }

        .bm-fg-name > span {
          color: #f1f5f9;
          transition: all 0.4s ease;
        }

        .bm:hover .bm-fg-name > span {
          color: #ffffff;
        }

        /* ---- Ž shimmer ---- */
        .bm-fg-z {
          position: relative;
          color: #38bdf8 !important;
          background: linear-gradient(
            90deg,
            #38bdf8 0%,
            #00d4ff 25%,
            #ffffff 50%,
            #00d4ff 75%,
            #38bdf8 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: bmShimmer 3s ease-in-out infinite;
        }

        @keyframes bmShimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* ---- Hover underline ---- */
        .bm-line {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 70%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          border-radius: 1px;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
        }

        .bm:hover .bm-line {
          transform: translateX(-50%) scaleX(1);
        }

        :global(.dark) .bm-line {
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
        }

        @media (prefers-color-scheme: dark) {
          .bm-line {
            background: linear-gradient(90deg, transparent, #00d4ff, transparent);
          }
        }

        /* ---- Accent dot ---- */
        .bm-dot {
          position: absolute;
          top: 0px;
          right: 0px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          z-index: 3;
          animation: bmPulse 3s ease-in-out infinite;
        }

        @keyframes bmPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        /* ============ LIGHT MODE override ============ */
        /* Badge is always dark-themed for contrast */

        :global(:not(.dark)) .bm-inner {
          background: linear-gradient(145deg, #1e293b, #0f172a);
        }

        /* ============ DARK MODE ============ */

        :global(.dark) .bm-ring {
          border-color: rgba(0, 212, 255, 0.12);
        }

        :global(.dark) .bm:hover .bm-ring {
          border-color: rgba(0, 212, 255, 0.35);
          box-shadow: 0 0 16px rgba(0, 212, 255, 0.08);
        }

        :global(.dark) .bm:hover .bm-inner {
          box-shadow:
            0 4px 16px rgba(0, 212, 255, 0.12),
            0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        :global(.dark) .bm-dot {
          background: linear-gradient(135deg, #00d4ff, #06b6d4);
        }

        @media (prefers-color-scheme: dark) {
          .bm-ring { border-color: rgba(0, 212, 255, 0.12); }
          .bm:hover .bm-ring {
            border-color: rgba(0, 212, 255, 0.35);
            box-shadow: 0 0 16px rgba(0, 212, 255, 0.08);
          }
          .bm:hover .bm-inner {
            box-shadow: 0 4px 16px rgba(0, 212, 255, 0.12), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04);
          }
          .bm-dot { background: linear-gradient(135deg, #00d4ff, #06b6d4); }
        }
      `}</style>
    </a>
  );
}
