// src/app/page.tsx
'use client';

import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function Home() {
  return (
    <>
      <SignedOut>
        <main>
          <h1>Public home</h1>
        </main>
      </SignedOut>

      <SignedIn>
        <main>
          <h1>Welcome back</h1>
          <p><Link href="/dashboard">Go to your dashboard</Link></p>
        </main>
      </SignedIn>
    </>
  );
}
