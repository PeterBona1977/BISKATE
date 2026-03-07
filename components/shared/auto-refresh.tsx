"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

export function AutoRefresh() {
  const router = useRouter()

  const refreshPage = useCallback(() => {
    console.log("🔄 AutoRefresh: Performing seamless background data refresh...")
    router.refresh()
  }, [router])

  useEffect(() => {
    // 1. Refresh on an interval (e.g. every 30 seconds)
    const REFRESH_INTERVAL_MS = 30000 
    const intervalId = setInterval(refreshPage, REFRESH_INTERVAL_MS)

    // 2. Refresh when the page regains visibility (e.g. user returns to the tab or app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPage()
      }
    }

    // 3. Refresh when the device comes back online from an offline state
    const handleOnline = () => {
      refreshPage()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("online", handleOnline)

    // Initial log
    console.log("⏱️ AutoRefresh initialized: will refresh data every 30s or on tab focus.")

    return () => {
      clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("online", handleOnline)
    }
  }, [refreshPage])

  // This component doesn't render any visible UI
  return null
}
