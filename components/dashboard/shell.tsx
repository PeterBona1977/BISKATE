"use client"

import type React from "react"
import { DashboardHeader } from "./dashboard-header"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
