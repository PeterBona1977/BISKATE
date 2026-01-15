"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PageLoading } from "@/components/ui/page-loading"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requireAdmin?: boolean
}

export function AuthGuard({ children, redirectTo = "/login", requireAdmin = false }: AuthGuardProps) {
  const { isAuthenticated, loading, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requireAdmin && profile?.role !== "admin") {
        router.push("/")
      }
    }
  }, [isAuthenticated, loading, router, redirectTo, requireAdmin, profile])

  if (loading) {
    return <PageLoading />
  }

  if (!isAuthenticated) {
    return <PageLoading />
  }

  if (requireAdmin && profile?.role !== "admin") {
    return <PageLoading />
  }

  return <>{children}</>
}
