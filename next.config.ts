import type { NextConfig } from "next";

// Sicherheits-Header für alle Routen (OWASP Best Practices)
const securityHeaders = [
  // HSTS: HTTPS für 1 Jahr erzwingen (inkl. Subdomains)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Clickjacking-Schutz: keine iFrames erlaubt
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // MIME-Sniffing deaktivieren
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // XSS-Filter (legacy, aber schadet nicht)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Referrer nicht an externe Seiten weitergeben
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Browser-Features einschränken
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  // Content Security Policy:
  // - default-src 'self': nur eigene Ressourcen erlaubt
  // - script-src: Next.js benötigt 'unsafe-inline' und 'unsafe-eval' für RSC
  // - img-src: eigene + YouTube-Thumbnails + data URIs
  // - frame-src: nur YouTube-Embeds
  // - connect-src: eigene API + NTP-Endpunkt für die Uhr
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://img.youtube.com https://i.ytimg.com https://*.tile.openstreetmap.org",
      "font-src 'self' data:",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self' https://worldtime.formality.de",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",

  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },

  async headers() {
    return [
      // Security Headers auf ALLEN Seiten
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // API-Routen: kein Caching + CORS einschränken
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
          // CORS: nur gleiche Origin erlaubt
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === "production"
              ? "https://kezar.at"
              : "http://localhost:4004",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
      // Statische Assets: lang cachen
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
