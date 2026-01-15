"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AnalyticsService } from "@/lib/analytics/analytics-service"
import { useUser } from "@/hooks/use-user"

export function useAnalyticsTracking() {
  const pathname = usePathname()
  const { user } = useUser()

  useEffect(() => {
    // Track page view
    AnalyticsService.trackEvent(
      {
        event_name: "page_view",
        event_category: "navigation",
        event_data: {
          page: pathname,
          timestamp: new Date().toISOString(),
        },
      },
      user?.id,
    )
  }, [pathname, user?.id])

  const trackEvent = (eventName: string, category: string, data?: Record<string, any>) => {
    AnalyticsService.trackEvent(
      {
        event_name: eventName,
        event_category: category,
        event_data: data,
      },
      user?.id,
    )
  }

  const trackGigCreated = (gigId: string, category: string) => {
    trackEvent("gig_created", "gigs", { gig_id: gigId, category })
  }

  const trackProposalSent = (gigId: string, proposalId: string) => {
    trackEvent("proposal_sent", "proposals", { gig_id: gigId, proposal_id: proposalId })
  }

  const trackPaymentCompleted = (amount: number, gigId: string) => {
    trackEvent("payment_completed", "payments", { amount, gig_id: gigId })
  }

  const trackUserSignup = (method: string) => {
    trackEvent("user_signup", "auth", { method })
  }

  return {
    trackEvent,
    trackGigCreated,
    trackProposalSent,
    trackPaymentCompleted,
    trackUserSignup,
  }
}
