"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function AuthRedirect() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)
  const redirectCount = useRef(0)

  useEffect(() => {
    // PROTEÇÃO MÁXIMA CONTRA LOOPS
    if (hasRedirected.current) {
      console.log("🛑 LOOP PROTECTION: Already redirected, skipping")
      return
    }

    if (redirectCount.current >= 3) {
      console.log("🛑 LOOP PROTECTION: Max redirects reached")
      return
    }

    if (loading) {
      console.log("⏳ AUTH_REDIRECT: Still loading, waiting...")
      return
    }

    const authRoutes = ["/login", "/register"]
    const isAuthRoute = authRoutes.includes(pathname)

    console.log("🔍 AUTH_REDIRECT_CHECK:", {
      hasUser: !!user,
      pathname,
      isAuthRoute,
      redirectCount: redirectCount.current,
    })

    // APENAS redirecionar se estiver em página de auth E tiver usuário
    if (user && isAuthRoute) {
      redirectCount.current++
      hasRedirected.current = true

      console.log("🎯 REDIRECTING: User authenticated, going to dashboard")

      // Usar setTimeout para evitar problemas de timing
      setTimeout(() => {
        try {
          window.location.href = "/dashboard"
        } catch (err) {
          console.error("❌ Redirect failed:", err)
        }
      }, 100)
    }
  }, [user, loading, pathname, router])

  return null
}
