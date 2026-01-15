import { AuthGuard } from "@/components/auth/auth-guard"
import { UsersManagementEnhanced } from "@/components/admin/users-management-enhanced"

export default function EnhancedUsersPage() {
  return (
    <AuthGuard requireAdmin>
      <div className="container mx-auto py-8">
        <UsersManagementEnhanced />
      </div>
    </AuthGuard>
  )
}
