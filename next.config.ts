import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  output: "standalone",
};

export default nextConfig;
