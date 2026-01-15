"use client"

import { useCallback } from "react"

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void
  }
}

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, {
        event_category: "engagement",
        event_label: parameters?.label || "",
        value: parameters?.value || 0,
        ...parameters,
      })
    }
  }, [])

  const trackPageView = useCallback((url: string, title?: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "G-81969ZG3NR", {
        page_path: url,
        page_title: title || document.title,
      })
    }
  }, [])

  // Eventos específicos do Biskate
  const trackGigCreated = useCallback(
    (gigId: string, category: string) => {
      trackEvent("gig_created", {
        event_category: "gigs",
        gig_id: gigId,
        gig_category: category,
      })
    },
    [trackEvent],
  )

  const trackUserRegistration = useCallback(
    (method: string) => {
      trackEvent("sign_up", {
        method: method,
        event_category: "authentication",
      })
    },
    [trackEvent],
  )

  const trackUserLogin = useCallback(
    (method: string) => {
      trackEvent("login", {
        method: method,
        event_category: "authentication",
      })
    },
    [trackEvent],
  )

  const trackContactView = useCallback(
    (gigId: string) => {
      trackEvent("contact_view", {
        event_category: "engagement",
        gig_id: gigId,
      })
    },
    [trackEvent],
  )

  const trackProposalSent = useCallback(
    (gigId: string) => {
      trackEvent("proposal_sent", {
        event_category: "conversion",
        gig_id: gigId,
      })
    },
    [trackEvent],
  )

  return {
    trackEvent,
    trackPageView,
    trackGigCreated,
    trackUserRegistration,
    trackUserLogin,
    trackContactView,
    trackProposalSent,
  }
}
