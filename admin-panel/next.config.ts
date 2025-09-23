import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;
