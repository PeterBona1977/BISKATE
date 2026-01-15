import { Suspense } from "react"
import { ProviderProfile } from "@/components/provider/provider-profile"
import { PageLoading } from "@/components/ui/page-loading"

export default function ProviderProfilePage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<PageLoading />}>
        <ProviderProfile />
      </Suspense>
    </div>
  )
}
