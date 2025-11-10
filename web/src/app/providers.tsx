// src/app/providers.tsx
'use client';

import { ClerkProvider } from '@clerk/nextjs';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
