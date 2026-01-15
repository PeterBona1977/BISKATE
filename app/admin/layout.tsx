"use client"

import type { ReactNode } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AdminLayoutWrapper({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AuthGuard requireAdmin={true}>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  )
}
