import { clerkMiddleware } from '@clerk/nextjs/server';

// This is the correct syntax for Clerk v6+
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Always run for API routes
    '/api/:path*',
  ],
};