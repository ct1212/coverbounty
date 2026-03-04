import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headers for PWA service worker and security
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Allow connections to external socket server if needed
  async rewrites() {
    const socketUrl = process.env.SOCKET_IO_URL;
    if (socketUrl && socketUrl !== process.env.NEXT_PUBLIC_APP_URL) {
      return [
        {
          source: "/socket.io/:path*",
          destination: `${socketUrl}/socket.io/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
