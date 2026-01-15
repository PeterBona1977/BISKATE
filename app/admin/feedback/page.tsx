import { Suspense } from "react"
import { PageLoading } from "@/components/ui/page-loading"
import { FeedbackManagement } from "@/components/admin/lazy-admin-components"

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<PageLoading text="Carregando gestão de feedback..." />}>
      <FeedbackManagement />
    </Suspense>
  )
}
