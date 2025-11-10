// src/lib/auth-optional.ts
import { auth } from '@clerk/nextjs/server';

export async function getClerkUserIdOptional() {
  const { userId } = await auth();
  return userId ?? null;
}
