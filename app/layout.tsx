// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import { AppShell } from '@/components/layout/AppShell';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline} — Online Shopping in Ghana`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'skin care Ghana',
    'body lotion Ghana',
    'Nivea Ghana',
    'Vaseline Ghana',
    "Johnson's baby Ghana",
    'face cream',
    'vitamin c serum',
    'shampoo and conditioner Ghana',
    'shower gel',
    'baby diapers',
    'baby lotion',
    'mother care Ghana',
    'online shopping Ghana',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    type: 'website',
    locale: 'en_GH',
    siteName: site.nameFull,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: '#e11b22',
  width: 'device-width',
  initialScale: 1,
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased bg-white text-ink font-sans">
        <JsonLd id="site" data={[organizationSchema(), websiteSchema()]} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
