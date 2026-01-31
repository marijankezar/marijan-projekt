import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Server Actions deaktivieren (wir verwenden keine)
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },

  // Cache-Control Headers hinzufügen
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;