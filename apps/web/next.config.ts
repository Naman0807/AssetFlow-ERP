import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [],
  // Bun compatibility — use built-in fetch
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
