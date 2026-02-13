import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Server Actions deaktivieren (wir verwenden keine)
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },

  // Cache-Control Headers - nur API-Routen no-store
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
