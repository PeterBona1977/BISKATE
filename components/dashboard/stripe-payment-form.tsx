"use client"

import { useState } from "react"
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface StripePaymentFormProps {
    onSuccess: (paymentIntentId: string) => void;
    amount: number;
}

export function StripePaymentForm({ onSuccess, amount }: StripePaymentFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) return

        setIsProcessing(true)
        setErrorMessage(null)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required even if redirect: "if_required" is used
                return_url: window.location.origin + "/dashboard/billing",
            },
            redirect: "if_required",
        })

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.")
            setIsProcessing(false)
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess(paymentIntent.id)
        } else {
            setErrorMessage("Payment failed or is still processing.")
            setIsProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {errorMessage && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100 font-medium">
                    {errorMessage}
                </div>
            )}
            <Button
                type="submit"
                className="w-full h-11"
                disabled={!stripe || isProcessing}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    `Confirm Payment (€${amount.toFixed(2)})`
                )}
            </Button>
        </form>
    )
}
