// src/app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

import { AppShell } from '@/components//layout/AppShell'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sally — Premium Online Store',
  description: 'Curated essentials for the modern lifestyle.',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white text-gray-900`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}