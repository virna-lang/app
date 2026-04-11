import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  eslint: {
    // Warnings não bloqueiam o build no Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Erros de tipo não bloqueiam o build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
