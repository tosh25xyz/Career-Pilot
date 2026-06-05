import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes যেগুলো public (login ছাড়া দেখা যাবে)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect(); // লগইন না থাকলে sign-in এ redirect
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
