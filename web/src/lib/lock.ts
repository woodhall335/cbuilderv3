// src/lib/lock.ts
export function isLocked(status: string, locked_at?: string | null) {
  if (status === 'locked') return true;
  if (!locked_at) return false;
  return Date.now() >= new Date(locked_at).getTime();
}
