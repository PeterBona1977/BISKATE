"use client"

import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  size?: "small" | "medium" | "large"
  href?: string
}

export function Logo({ className, size = "medium", href, ...props }: LogoProps) {
  const sizeClasses = {
    small: "h-12 w-24",
    medium: "w-[140px] h-[60px]", // Keep standard header height
    large: "h-32 w-64",
  }

  // Calculate image sizes based on the variant so they pop out appropriately
  const imgSizeClasses = {
    small: "w-[120px] h-[120px]",
    medium: "w-[240px] h-[240px]", // Huge visual size to make text readable
    large: "w-[400px] h-[400px]",
  }

  const logoContent = (
    <div className={cn("flex items-center", className)} {...props}>
      <div
        className={cn(
          "bg-transparent flex items-center justify-center relative",
          sizeClasses[size],
        )}
      >
        <img
          src="/biskate-logo.png"
          alt="Biskate"
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none object-contain pointer-events-none",
            imgSizeClasses[size]
          )}
        />
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
