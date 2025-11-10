// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import SiteHeader from '@/components/Header';
import SiteFooter from '@/components/Footer'; // if you have one

export const metadata: Metadata = { title: 'Contract Heaven' };
export const runtime = 'nodejs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SiteHeader />
          {children}
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
