// src/lib/auth.ts
import 'server-only';

/**
 * Returns the Clerk userId (string) or null if:
 * - Clerk isn't installed/initialized
 * - The request isn't authenticated
 * - We’re running in a context without request headers
 */
export async function getUserId(): Promise<string | null> {
  try {
    // Dynamic import so this module can be loaded even if Clerk isn't installed yet.
    const { auth } = await import('@clerk/nextjs/server');

    // In Next.js 16 / Clerk, auth() can be async — await it.
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

/** Throws if not authenticated. */
export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error('Not authenticated');
  return id;
}
