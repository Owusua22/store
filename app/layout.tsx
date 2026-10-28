// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import { AppShell } from '@/components/layout/AppShell';
import { JsonLd } from '@/components/seo/JsonLd';
import { Analytics, searchConsoleVerification } from '@/components/seo/Analytics';
import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nameFull} — East Doboro, Nsawam | ${site.tagline}`,
    template: `%s | ${site.nameFull}`,
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
    'skincare shop East Doboro',
    'cosmetics shop Nsawam',
    'mothercare Nsawam',
    'baby products Doboro',
    'skincare near St. George’s Height',
  ],
  alternates: { canonical: '/' },
  verification: { google: searchConsoleVerification() },
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
  themeColor: '#1b4d3e',
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
        <Analytics />
      </body>
    </html>
  );
}
