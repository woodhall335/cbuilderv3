// src/middleware.ts
import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Public routes (no auth)
const isPublicRoute = createRouteMatcher([
  '/',
  '/contracts(.*)',
  '/letters(.*)',
  '/tools(.*)',
  '/litigation(.*)',
  '/wizard(.*)',
  '/preview(.*)',
  '/api/blueprints(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/favicon.ico',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  // IMPORTANT: use the "auth" handle Clerk injects into this callback.
  const { userId } = await auth();
  if (!userId) {
    const url = new URL('/sign-in', req.url);
    url.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // protect app routes (including /dashboard)
    '/((?!_next|.*\\..*).*)',
    // and all API routes
    '/api/(.*)',
  ],
};
