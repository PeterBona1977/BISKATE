"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { ProfileCompletionService } from "@/lib/profile/profile-completion-service"

export function ProfileCompletionBanner() {
  const { profile } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Use real profile data if available, otherwise use mock data
  const completionData = profile
    ? ProfileCompletionService.calculateCompletion(profile)
    : ProfileCompletionService.getMockCompletionData()

  const { completionPercentage, nextSteps } = completionData

  useEffect(() => {
    // Check if banner was dismissed in the last 24 hours
    const dismissedAt = localStorage.getItem("profile-completion-banner-dismissed")
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000

    if (dismissedAt && now - Number.parseInt(dismissedAt) < twentyFourHours) {
      setIsDismissed(true)
      return
    }

    // Show banner only if profile completion is less than 80%
    if (completionPercentage < 80) {
      setIsVisible(true)
    }
  }, [completionPercentage])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem("profile-completion-banner-dismissed", Date.now().toString())
  }

  if (!isVisible || isDismissed || completionPercentage >= 80) {
    return null
  }

  const nextStep = nextSteps[0]

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <User className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-blue-900">Complete o seu perfil ({completionPercentage}%)</span>
            {nextStep && (
              <>
                <span className="text-blue-700">•</span>
                <span className="text-blue-700">Próximo: {nextStep.title}</span>
              </>
            )}
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Um perfil completo atrai mais clientes e aumenta a sua credibilidade.
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Link href="/dashboard/profile">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Completar
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
