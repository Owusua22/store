// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import { AppShell } from '@/components/layout/AppShell';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL('https://sallyskincare.com'),
  title: {
    default: `${site.name} | ${site.tagline} — Online Shopping in Ghana`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'skin care Ghana',
    'body lotion Ghana',
    'face cream',
    'vitamin c serum',
    'shampoo',
    'shower gel',
    'baby diapers',
    'baby lotion',
    'online shopping Ghana',
  ],
  openGraph: {
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    type: 'website',
    locale: 'en_GH',
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
    <html lang="en">
      <body className="antialiased bg-white text-ink font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
