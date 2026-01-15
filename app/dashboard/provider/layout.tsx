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

            // If user is NOT a provider (and hasn't applied yet), they should only access onboarding
            if (!profile?.is_provider && pathname !== "/dashboard/provider/onboarding") {
                router.push("/dashboard/provider/onboarding")
            }

            // If user IS already a provider, they shouldn't see onboarding again (optional, depending on UX)
            // but let's allow re-accessing onboarding if needed or simple redirect
            // Usually, if they are pending/approved, onboarding is done.
            if (profile?.is_provider && pathname === "/dashboard/provider/onboarding") {
                router.push("/dashboard/provider")
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
