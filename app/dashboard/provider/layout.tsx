"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
                return
            }

            // STRICT ACCESS CONTROL
            // 1. If not a provider at all -> Onboarding (to apply)
            // 2. If provider but NOT approved (pending/rejected) -> Onboarding (to see status/re-apply)
            // 3. Approved -> Allow access

            const isProvider = profile?.is_provider
            const status = profile?.provider_status

            // Allow access to onboarding page regardless of status (handles its own logic)
            if (pathname === "/dashboard/provider/onboarding") {
                // Optional: If APPROVED, maybe redirect to main dashboard?
                if (isProvider && status === 'approved') {
                    router.push("/dashboard/provider")
                }
                return;
            }

            // For all other provider pages, Require 'approved' status
            if (!isProvider || status !== 'approved') {
                router.push("/dashboard/provider/onboarding")
            }
        }
    }, [loading, user, profile, router, pathname])

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // If redirecting, also show loader or null
    if (!user || (!profile?.is_provider && pathname !== "/dashboard/provider/onboarding")) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return <>{children}</>
}
