import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker (not used by Vercel)
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,

  async rewrites() {
    // For local development and Docker
    // Vercel uses vercel.json rewrites instead
    if (process.env.VERCEL) {
      return [];
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
