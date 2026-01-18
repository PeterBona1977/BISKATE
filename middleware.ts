import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  localePrefix: 'never'
});

export async function middleware(request: NextRequest) {
  // SHORT-CIRCUIT: Explicitly ignore all static assets to prevent 500 errors
  // This is a safety net in case the matcher misses something (like query params)
  if (
    request.nextUrl.pathname.endsWith(".js") ||
    request.nextUrl.pathname.endsWith(".css") ||
    request.nextUrl.pathname.endsWith(".png") ||
    request.nextUrl.pathname.endsWith(".jpg") ||
    request.nextUrl.pathname.endsWith(".ico") ||
    request.nextUrl.pathname.includes("webpack") ||
    request.nextUrl.pathname.includes("main.js")
  ) {
    return NextResponse.next()
  }

  // Initialize response
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  try {
    // IMPORTANT: reliable way to refresh session
    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/admin"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // Admin routes that require admin role
    const adminRoutes = ["/admin"]
    const isAdminRoute = adminRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/register", "/verify-email", "/diagnostic", "/setup", "/test-connection", "/emergency-fix"]
    const isPublicRoute = publicRoutes.some(
      (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route),
    )

    // Get user role for redirection logic
    let userRole = null
    if (user) {
      // Small optimization: only fetch role if we actually need it for a redirect
      const isRoot = request.nextUrl.pathname === "/"
      const isAuthPage = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register"
      const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")

      if (isRoot || isAuthPage || isDashboardPage) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        userRole = profile?.role
      }
    }

    // Redirect authenticated admins away from landing page if not explicitly viewing it
    if (request.nextUrl.pathname === "/" && user && userRole === "admin") {
      const viewWebsite = request.nextUrl.searchParams.get("view") === "website"
      if (!viewWebsite) {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
    }

    // Redirect to login if accessing protected routes without authentication
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Allow access to public routes (Must be AFTER the admin redirect check for "/")
    if (isPublicRoute) {
      return response
    }

    // For admin routes, allow access (we'll handle admin check in the auth layout/guard)
    // This bypass prevents repeated DB queries for role on every admin leaf page
    if (isAdminRoute && user) {
      return response
    }

    // Redirect authenticated users away from auth pages
    if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && user) {
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Prevent admins from accessing dashboard (except strictly what's needed, but requirement is NO dashboard for admins)
    if (request.nextUrl.pathname.startsWith("/dashboard") && userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, allow the request to continue to avoid blocking
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)(?:\\?.*)?$).*)",
  ],
}
