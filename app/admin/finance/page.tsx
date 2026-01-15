"use client"

import { FinanceManagement } from "@/components/admin/finance-management"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AdminFinancePage() {
    return (
        <AuthGuard requireAdmin={true}>
            <div className="p-4 lg:p-6">
                <FinanceManagement />
            </div>
        </AuthGuard>
    )
}
