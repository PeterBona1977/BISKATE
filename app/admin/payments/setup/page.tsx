import { StripeSetupGuide } from "@/components/payments/stripe-setup-guide"

export default function PaymentsSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <StripeSetupGuide />
      </div>
    </div>
  )
}
