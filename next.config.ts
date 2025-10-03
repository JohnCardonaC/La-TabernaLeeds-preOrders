import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
          hostname: '192.168.68.108',
          port: '3000',
        },
        {
          protocol: 'https',
          hostname: '192.168.68.108',
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

