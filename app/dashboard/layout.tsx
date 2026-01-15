"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { useEmergencyHeartbeat } from "@/hooks/use-emergency-heartbeat"
import { useTranslations } from "next-intl"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Common")
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // Enable live location heartbeat for providers
  useEmergencyHeartbeat()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (profile?.role === "admin") {
        router.push("/admin")
      }
    }
  }, [loading, user, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (!user || profile?.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t("redirecting")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex h-screen overflow-hidden pt-16">
        {/* Sidebar - hidden on mobile in this standard layout, but let's keep it and adjust */}
        <DashboardSidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
