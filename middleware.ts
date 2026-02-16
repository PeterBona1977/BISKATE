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
  // 1. Handle Static Assets (Short-circuit)
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes("/static/") ||
    request.nextUrl.pathname.endsWith(".ico") ||
    request.nextUrl.pathname.endsWith(".json") ||
    request.nextUrl.pathname.endsWith(".xml") ||
    request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg)$/)
  ) {
    return NextResponse.next()
  }

  // 2. Initialize Response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 3. Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Middleware: Supabase environment variables missing. Skipping auth checks.")
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const protectedRoutes = ["/dashboard", "/admin"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      const userRole = profile?.role

      if (request.nextUrl.pathname === "/" && userRole === "admin") {
        const viewWebsite = request.nextUrl.searchParams.get("view") === "website"
        if (!viewWebsite) return NextResponse.redirect(new URL("/admin", request.url))
      }

      if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
        return NextResponse.redirect(new URL(userRole === "admin" ? "/admin" : "/dashboard", request.url))
      }

      if (request.nextUrl.pathname.startsWith("/dashboard") && userRole === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url))
      }
    }
  } catch (error) {
    console.error("Middleware error:", error)
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
