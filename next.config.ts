import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // API routes are now handled by Next.js itself in /src/app/api
  // No need to proxy to external server
  
  // Fix workspace root warning
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
