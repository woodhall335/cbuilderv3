'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

type NavLinksProps = {
  onClick?: () => void;
};

function NavLinks({ onClick }: NavLinksProps) {
  return (
    <>
      <Link href="/contracts" onClick={onClick}>
        Contracts
      </Link>
      <Link href="/letters" onClick={onClick}>
        Letters
      </Link>
      <Link href="/tools" onClick={onClick}>
        Tools
      </Link>
      <Link href="/litigation" onClick={onClick}>
        Litigation
      </Link>
      <SignedIn>
        <Link href="/dashboard" onClick={onClick}>
          Dashboard
        </Link>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="rounded bg-black px-3 py-1.5 text-white text-sm" onClick={onClick}>
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-16">
        <Link href="/" className="font-semibold">Contract Heaven</Link>

        {/* Desktop */}
        <nav className="hidden md:flex gap-6 text-sm items-center">
          <NavLinks />
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden rounded border px-2 py-1"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 text-sm">
            <NavLinks onClick={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </header>
  );
}
