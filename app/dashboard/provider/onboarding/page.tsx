import { Suspense } from "react"
import { EnhancedProviderOnboarding } from "@/components/provider/enhanced-provider-onboarding"
import { PageLoading } from "@/components/ui/page-loading"

export default function ProviderOnboardingPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<PageLoading />}>
        <EnhancedProviderOnboarding />
      </Suspense>
    </div>
  )
}
