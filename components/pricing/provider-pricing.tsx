"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown, Infinity } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface PricingPlan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  limitations: string[]
  popular?: boolean
  icon: React.ReactNode
  color: string
  buttonText: string
}

const providerPlans: PricingPlan[] = [
  {
    id: "gig-starter",
    name: "Gig Starter",
    price: 0,
    period: "month",
    description: "Perfect for starting as a service provider",
    features: [
      "Up to 5 proposals per month",
      "Basic profile",
      "Email support",
      "Access to basic gigs",
      "Portfolio with 3 projects",
    ],
    limitations: ["15% transaction fee", "No featured listing", "No advanced analytics"],
    icon: <Star className="h-6 w-6" />,
    color: "border-gray-200",
    buttonText: "Start for Free",
  },
  {
    id: "gig-pro",
    name: "Gig Professional",
    price: 19.99,
    period: "month",
    description: "For providers who want to grow their business",
    features: [
      "Unlimited proposals",
      "Premium profile with highlight",
      "Priority support",
      "Access to all gigs",
      "Unlimited portfolio",
      "Detailed analytics",
      "Verified provider badge",
      "Automatic response",
    ],
    limitations: ["10% transaction fee"],
    popular: true,
    icon: <Zap className="h-6 w-6" />,
    color: "border-blue-500",
    buttonText: "Choose Pro",
  },
  {
    id: "gig-business",
    name: "Gig Business",
    price: 49.99,
    period: "month",
    description: "For established companies and providers",
    features: [
      "Everything in Professional",
      "Multiple users",
      "Team management",
      "Custom API",
      "Advanced reports",
      "24/7 phone support",
      "Dedicated account manager",
      "CRM integration",
    ],
    limitations: ["7% transaction fee"],
    icon: <Crown className="h-6 w-6" />,
    color: "border-purple-500",
    buttonText: "Choose Business",
  },
  {
    id: "gig-unlimited",
    name: "Gig Unlimited",
    price: 99.99,
    period: "month",
    description: "Complete solution for large providers and companies",
    features: [
      "Everything in previous plans",
      "No proposal limits",
      "Maximum priority in results",
      "Customized consulting",
      "Exclusive training",
      "Beta access to new features",
      "Executive dashboard",
      "24/7 VIP support",
    ],
    limitations: ["Only 5% transaction fee"],
    icon: <Infinity className="h-6 w-6" />,
    color: "border-gold-500",
    buttonText: "Choose Unlimited",
  },
]

export function ProviderPricing() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to choose a plan",
        variant: "destructive",
      })
      return
    }

    setLoading(planId)

    try {
      // Simular seleção de plano
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Plan selected!",
        description: `Plan ${providerPlans.find((p) => p.id === planId)?.name} activated successfully.`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not activate the plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Provider Plans</h2>
        <p className="text-gray-600 mt-2">
          Choose the ideal plan to grow your business on the GigHub platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {providerPlans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.color} ${plan.popular ? "ring-2 ring-blue-500" : ""}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">Most Popular</Badge>
            )}

            <CardHeader className="text-center pb-4">
              <div
                className={`mx-auto mb-4 p-3 rounded-full ${plan.id === "biscateiro-free"
                    ? "bg-gray-100"
                    : plan.id === "biscateiro-pro"
                      ? "bg-blue-100"
                      : plan.id === "biscateiro-business"
                        ? "bg-purple-100"
                        : "bg-yellow-100"
                  }`}
              >
                {plan.icon}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price === 0 ? "Free" : `$${plan.price}`}</span>
                {plan.price > 0 && <span className="text-gray-500">/{plan.period}</span>}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-green-700 mb-2">✓ Included:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {plan.limitations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Limitations:</h4>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                    Activating...
                  </div>
                ) : (
                  plan.buttonText
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Payment System:</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            • <strong>Clients:</strong> Pay a fee based on the service category (defined by category)
          </li>
          <li>
            • <strong>Providers:</strong> Pay the chosen plan fee on each transaction
          </li>
          <li>• Fees are applied only on completed transactions</li>
          <li>• You can change or cancel your plan at any time</li>
          <li>• Technical support available for all users</li>
          <li>• Secure payments processed via Stripe</li>
        </ul>
      </div>
    </div>
  )
}
