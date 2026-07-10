import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/home(.*)",
  "/items(.*)",
  "/library(.*)",
  "/admin(.*)",
  "/api/homes(.*)",
  "/api/rooms(.*)",
  "/api/items(.*)",
  "/api/upload(.*)",
  "/api/notifications(.*)",
  "/api/calendar/token(.*)",
  "/api/export(.*)",
  "/api/billing(.*)",
  "/api/admin(.*)",
  "/api/support(.*)",
]);

// These routes use their own auth (token-based, cron secret, or Stripe signature)
const isPublicApiRoute = createRouteMatcher([
  "/api/calendar/feed(.*)",
  "/api/cron(.*)",
  "/api/billing/webhook(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicApiRoute(req)) {
    return;
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
