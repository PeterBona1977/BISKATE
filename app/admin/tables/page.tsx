import { AuthGuard } from "@/components/auth/auth-guard"
import { TableManagement } from "@/components/admin/table-management"

export default function TablesPage() {
  return (
    <AuthGuard requireAdmin>
      <div className="container mx-auto py-8">
        <TableManagement />
      </div>
    </AuthGuard>
  )
}
