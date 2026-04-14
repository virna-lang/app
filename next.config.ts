import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  typescript: {
    // Erros de tipo não bloqueiam o build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
