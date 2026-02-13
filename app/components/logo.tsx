'use client';

export default function Logo() {
  const chars = [
    { ch: '<', cls: 'bracket', d: 0 },
    { ch: '\u00A0', cls: 'sp', d: 60 },
    { ch: 'k', cls: 'name', d: 120 },
    { ch: 'e', cls: 'name', d: 180 },
    { ch: 'ž', cls: 'name accent', d: 240 },
    { ch: 'a', cls: 'name', d: 300 },
    { ch: 'r', cls: 'name', d: 360 },
    { ch: '.', cls: 'dot', d: 420 },
    { ch: 'a', cls: 'tld', d: 480 },
    { ch: 't', cls: 'tld', d: 540 },
    { ch: '\u00A0', cls: 'sp', d: 600 },
    { ch: '/', cls: 'bracket slash', d: 660 },
    { ch: '>', cls: 'bracket', d: 720 },
  ];

  return (
    <a
      href="https://kezar.at"
      target="_blank"
      rel="noopener noreferrer"
      className="mk-logo"
      aria-label="kežar.at"
    >
      <span className="mk-logo-text">
        {chars.map((c, i) => (
          <span
            key={i}
            className={`mk-ch mk-${c.cls}`}
            style={{ animationDelay: `${c.d}ms` }}
          >
            {c.ch}
          </span>
        ))}
      </span>

      {/* Scan light across the logo */}
      <span className="mk-scan" />

      {/* Hover underline */}
      <span className="mk-line" />

      <style jsx>{`
        .mk-logo {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          padding: 0.35rem 0.9rem;
          border-radius: 0.6rem;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace;
          font-size: clamp(0.85rem, 2vw, 1rem);
          letter-spacing: 0.03em;
        }

        .mk-logo:hover {
          background: rgba(59, 130, 246, 0.06);
          transform: translateY(-1px);
        }

        .mk-logo-text {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
        }

        /* ---- Characters ---- */
        .mk-ch {
          display: inline-block;
          opacity: 0;
          transform: translateY(8px);
          animation: mkReveal 0.5s ease forwards;
        }

        @keyframes mkReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Brackets: < /> */
        .mk-bracket {
          color: #3b82f6;
          font-weight: 300;
          opacity: 0;
          transition: all 0.4s ease;
        }

        .mk-logo:hover .mk-bracket {
          text-shadow: 0 0 14px rgba(59, 130, 246, 0.5);
        }

        /* First bracket < moves left on hover, last > moves right */
        .mk-bracket:first-child {
          transition: transform 0.4s ease, text-shadow 0.4s ease;
        }
        .mk-logo:hover .mk-bracket:first-child {
          transform: translateX(-2px);
        }
        .mk-bracket:last-child {
          transition: transform 0.4s ease, text-shadow 0.4s ease;
        }
        .mk-logo:hover .mk-bracket:last-child {
          transform: translateX(2px);
        }

        /* Name: kežar */
        .mk-name {
          font-weight: 700;
          color: #1e293b;
          transition: color 0.4s ease;
        }

        .mk-name.accent {
          color: #3b82f6;
        }

        .mk-logo:hover .mk-name {
          color: #1e40af;
        }

        /* Dot */
        .mk-dot {
          color: #94a3b8;
          font-weight: 400;
          transition: color 0.4s ease;
        }

        .mk-logo:hover .mk-dot {
          color: #3b82f6;
        }

        /* TLD: at */
        .mk-tld {
          color: #64748b;
          font-weight: 500;
          transition: color 0.4s ease;
        }

        .mk-logo:hover .mk-tld {
          color: #475569;
        }

        /* ---- Scan light ---- */
        .mk-scan {
          position: absolute;
          top: 0;
          left: -100%;
          width: 40%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(59, 130, 246, 0.08),
            rgba(59, 130, 246, 0.15),
            rgba(59, 130, 246, 0.08),
            transparent
          );
          animation: mkScan 4s ease-in-out infinite;
          animation-delay: 1.5s;
          z-index: 1;
          pointer-events: none;
        }

        @keyframes mkScan {
          0% { left: -40%; }
          100% { left: 140%; }
        }

        /* ---- Hover underline ---- */
        .mk-line {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 60%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          border-radius: 1px;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
        }

        .mk-logo:hover .mk-line {
          transform: translateX(-50%) scaleX(1);
        }

        /* ============ DARK MODE ============ */

        :global(.dark) .mk-logo:hover {
          background: rgba(0, 212, 255, 0.06);
        }

        :global(.dark) .mk-bracket {
          color: #00d4ff;
        }

        :global(.dark) .mk-logo:hover .mk-bracket {
          text-shadow: 0 0 16px rgba(0, 212, 255, 0.6);
        }

        :global(.dark) .mk-name {
          color: #e2e8f0;
        }

        :global(.dark) .mk-name.accent {
          color: #00d4ff;
        }

        :global(.dark) .mk-logo:hover .mk-name {
          color: #ffffff;
        }

        :global(.dark) .mk-dot {
          color: #64748b;
        }

        :global(.dark) .mk-logo:hover .mk-dot {
          color: #00d4ff;
        }

        :global(.dark) .mk-tld {
          color: #94a3b8;
        }

        :global(.dark) .mk-logo:hover .mk-tld {
          color: #cbd5e1;
        }

        :global(.dark) .mk-scan {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 212, 255, 0.06),
            rgba(0, 212, 255, 0.12),
            rgba(0, 212, 255, 0.06),
            transparent
          );
        }

        :global(.dark) .mk-line {
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
        }

        /* System dark mode fallback */
        @media (prefers-color-scheme: dark) {
          .mk-logo:hover {
            background: rgba(0, 212, 255, 0.06);
          }
          .mk-bracket { color: #00d4ff; }
          .mk-logo:hover .mk-bracket {
            text-shadow: 0 0 16px rgba(0, 212, 255, 0.6);
          }
          .mk-name { color: #e2e8f0; }
          .mk-name.accent { color: #00d4ff; }
          .mk-logo:hover .mk-name { color: #ffffff; }
          .mk-dot { color: #64748b; }
          .mk-logo:hover .mk-dot { color: #00d4ff; }
          .mk-tld { color: #94a3b8; }
          .mk-logo:hover .mk-tld { color: #cbd5e1; }
          .mk-scan {
            background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.06), rgba(0, 212, 255, 0.12), rgba(0, 212, 255, 0.06), transparent);
          }
          .mk-line {
            background: linear-gradient(90deg, transparent, #00d4ff, transparent);
          }
        }
      `}</style>
    </a>
  );
}
