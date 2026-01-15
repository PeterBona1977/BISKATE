import { Suspense } from "react"
import { PageLoading } from "@/components/ui/page-loading"
import { ResponsesManagement } from "@/components/admin/lazy-admin-components"

export default function AdminResponsesPage() {
  return (
    <Suspense fallback={<PageLoading text="Carregando gestão de respostas..." />}>
      <ResponsesManagement />
    </Suspense>
  )
}
