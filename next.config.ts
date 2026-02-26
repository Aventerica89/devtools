import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/clerk-proxy/:path*',
        destination: 'https://frontend-api.clerk.dev/:path*',
      },
    ]
  },
};

export default nextConfig;
