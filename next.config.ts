// next.config.ts
import type { NextConfig } from 'next';

/**
 * Image hosts are derived from the environment so uploaded product photos from
 * Cloudflare R2 (bucket: glow-up) and Supabase storage always render.
 */
function hostsFromEnv(): string[] {
  const hosts = new Set<string>();

  const add = (value?: string) => {
    if (!value) return;
    try {
      const url = new URL(value.startsWith('http') ? value : `https://${value}`);
      hosts.add(url.hostname);
    } catch {
      // ignore malformed values
    }
  };

  add(process.env.CLOUDFLARE_R2_PUBLIC_URL);
  add(process.env.NEXT_PUBLIC_SUPABASE_URL);

  return [...hosts];
}

const staticHosts = [
  'images.unsplash.com',
  '*.r2.cloudflarestorage.com',
  '*.r2.dev',
  '*.supabase.co',
];

const envHosts = hostsFromEnv();

const nextConfig: NextConfig = {
  images: {
    // Remote hosts used by the admin (Cloudflare R2 public URL, Supabase storage)
    remotePatterns: [
      ...new Set([...staticHosts, ...envHosts]),
    ].map((hostname) => ({ protocol: 'https' as const, hostname })),
    // Local dev over http://localhost still needs to serve public/images
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
