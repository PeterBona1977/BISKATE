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
    small: "h-12 w-32 text-sm",
    medium: "h-20 w-64 text-base",
    large: "h-28 w-96 text-lg",
  }

  const logoContent = (
    <div className={cn("flex items-center", className)} {...props}>
      <div
        className={cn(
          "bg-white rounded-lg flex items-center justify-center overflow-hidden",
          sizeClasses[size],
        )}
      >
        <img src="/biskate-logo.png" alt="Biskate" className="w-full h-full object-contain" />
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
