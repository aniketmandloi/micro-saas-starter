import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ================================
// Route Matchers
// ================================
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/features",
  "/docs",
  "/docs/(.*)",
  "/contact",
  "/privacy",
  "/terms",
  "/api/webhooks/(.*)",
  "/api/health",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback",
  // Static assets
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/_next/(.*)",
  "/images/(.*)",
  "/icons/(.*)",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isWebhookRoute = createRouteMatcher([
  "/api/webhooks/(.*)",
  "/api/health",
]);
const isOrgRequiredRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/settings(.*)",
  "/billing(.*)",
  "/analytics(.*)",
  "/team(.*)",
  "/api-keys(.*)",
  "/monitors(.*)",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();
  const { pathname } = req.nextUrl;

  // ================================
  // Public Routes - Allow Access
  // ================================
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // ================================
  // API Routes Authentication
  // ================================
  if (isApiRoute(req)) {
    // Allow webhook routes
    if (isWebhookRoute(req)) {
      return NextResponse.next();
    }

    // Check for API key authentication
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      // API key authentication - will be handled by route handlers
      return NextResponse.next();
    }

    // Require user authentication for API routes
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  // ================================
  // Protected App Routes
  // ================================

  // Redirect unauthenticated users to sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // ================================
  // Organization-Required Routes
  // ================================
  if (isOrgRequiredRoute(req) && !orgId) {
    // Redirect to organization selection/creation
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // ================================
  // Role-Based Route Protection
  // ================================

  // Admin-only routes
  if (isAdminRoute(req)) {
    // Admin check will be handled by the route components
    // This is just to ensure user is authenticated
    return NextResponse.next();
  }

  // ================================
  // Organization-Specific Routes
  // ================================

  // Routes that require specific organization context
  if (pathname.startsWith("/dashboard") && orgId) {
    // Validate organization access in route handlers
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
