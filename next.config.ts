import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack resolves modules relative to the Next app (not a higher workspace root)
  // When not using Turbopack in dev, this section is not needed
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
