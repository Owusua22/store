// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev', // ✅ Add this for your R2 public URLs
      },
      {
        protocol: 'https',
        hostname: 'pub-365e21c4348346a9958c66b176415b96.r2.dev', // ✅ Or add your specific domain
      },
    ],
  },
};

export default nextConfig;