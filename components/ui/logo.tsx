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
  const containerSizeClasses = {
    small: "h-8 sm:h-10",
    medium: "h-12 sm:h-16",
    large: "h-24 sm:h-32",
  }

  const logoContent = (
    <div className={cn("flex items-center", className, containerSizeClasses[size])} {...props}>
      <img
        src="/biskate-logo-full.png"
        alt="Biskate Logo"
        className="w-auto h-full max-w-full object-contain drop-shadow-sm"
      />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity block">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
