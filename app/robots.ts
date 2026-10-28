// app/robots.ts
import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Admin, cart, checkout and API routes carry no indexable content.
        disallow: ['/admin', '/admin/', '/api/', '/cart', '/checkout', '/account', '/profile', '/login', '/register'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
