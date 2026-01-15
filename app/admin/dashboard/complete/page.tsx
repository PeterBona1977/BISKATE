import { AuthGuard } from "@/components/auth/auth-guard"
import { CompleteDashboard } from "@/components/admin/complete-dashboard"

export default function CompleteDashboardPage() {
  return (
    <AuthGuard requireAdmin>
      <div className="container mx-auto py-8">
        <CompleteDashboard />
      </div>
    </AuthGuard>
  )
}
