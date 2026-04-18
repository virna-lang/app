import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Erros de tipo não bloqueiam o build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
