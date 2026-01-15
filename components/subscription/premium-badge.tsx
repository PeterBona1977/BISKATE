"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PremiumBadgeProps {
    plan: "free" | "essential" | "pro" | "unlimited"
    size?: "sm" | "md" | "lg"
    showIcon?: boolean
    className?: string
}

export function PremiumBadge({ plan, size = "md", showIcon = true, className }: PremiumBadgeProps) {
    if (plan === "free" || plan === "essential") {
        return null
    }

    const isVIP = plan === "unlimited"
    const badgeText = isVIP ? "VIP" : "PRO"
    const Icon = isVIP ? Crown : Zap

    const sizeClasses = {
        sm: "text-[10px] px-1.5 py-0.5 h-5",
        md: "text-xs px-2 py-1 h-6",
        lg: "text-sm px-3 py-1.5 h-7",
    }

    const iconSizes = {
        sm: "h-2.5 w-2.5",
        md: "h-3 w-3",
        lg: "h-3.5 w-3.5",
    }

    return (
        <Badge
            className={cn(
                "font-bold",
                sizeClasses[size],
                isVIP
                    ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white border-0"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0",
                className
            )}
        >
            {showIcon && <Icon className={cn(iconSizes[size], "mr-1")} />}
            {badgeText}
        </Badge>
    )
}

interface PremiumCardWrapperProps {
    children: React.ReactNode
    plan: "free" | "essential" | "pro" | "unlimited"
    className?: string
}

export function PremiumCardWrapper({ children, plan, className }: PremiumCardWrapperProps) {
    const isPremium = plan === "pro" || plan === "unlimited"

    if (!isPremium) {
        return <>{children}</>
    }

    return (
        <div
            className={cn(
                "relative rounded-lg",
                plan === "unlimited"
                    ? "ring-2 ring-yellow-500 ring-offset-2 shadow-lg shadow-yellow-500/20"
                    : "ring-2 ring-blue-500 ring-offset-2 shadow-lg shadow-blue-500/20",
                className
            )}
        >
            {children}
            {/* Premium glow effect */}
            <div
                className={cn(
                    "absolute inset-0 rounded-lg pointer-events-none",
                    plan === "unlimited"
                        ? "bg-gradient-to-br from-yellow-400/10 to-amber-600/10"
                        : "bg-gradient-to-br from-blue-400/10 to-purple-600/10"
                )}
            />
        </div>
    )
}
