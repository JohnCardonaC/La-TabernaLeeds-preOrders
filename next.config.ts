import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  hostname: 'localhost',
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ['@supabase/supabase-js'],
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
