// src/lib/supabase.ts
import { cookies, headers } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertEnv() {
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export async function supabaseServer() {
  assertEnv();

  // In Next 15/16 these are async
  const ck = await cookies();
  const h = await headers();

  return createServerClient(url!, anon!, {
    cookies: {
      get(name: string) {
        return ck.get(name)?.value;
      },
      // no-ops on the server, but required by the interface
      set(_name: string, _value: string, _options: CookieOptions) {},
      remove(_name: string, _options: CookieOptions) {},
    },
    global: {
      headers: {
        'x-forwarded-host': h.get('host') ?? '',
        origin: h.get('origin') ?? '',
      },
    } as any,
  });
}
