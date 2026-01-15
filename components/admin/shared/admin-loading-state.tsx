"use client"

import { Card, CardContent } from "@/components/ui/card"

interface AdminLoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
  fullPage?: boolean
  className?: string
}

export function AdminLoadingState({
  message = "Carregando dados...",
  size = "md",
  fullPage = false,
  className = "",
}: AdminLoadingStateProps) {
  const spinnerSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const containerClasses = fullPage
    ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    : "flex justify-center py-8"

  const content = (
    <div className="text-center">
      <div
        className={`${spinnerSizes[size]} animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4`}
      ></div>
      <p className="text-gray-600">{message}</p>
    </div>
  )

  if (fullPage) {
    return <div className={`${containerClasses} ${className}`}>{content}</div>
  }

  return (
    <Card className={className}>
      <CardContent className={containerClasses}>{content}</CardContent>
    </Card>
  )
}
