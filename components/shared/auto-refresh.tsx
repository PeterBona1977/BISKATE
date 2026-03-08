"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

export function AutoRefresh() {
  const router = useRouter()

  const refreshAll = useCallback(() => {
    // 1. Refresh Next.js Server Components (Server-side data)
    router.refresh()
    // 2. Dispatch a global custom event so ALL client components can re-fetch their own data
    window.dispatchEvent(new CustomEvent("app-refresh"))
  }, [router])

  useEffect(() => {
    // Refresh every 5 seconds
    const REFRESH_INTERVAL_MS = 5000
    const intervalId = setInterval(refreshAll, REFRESH_INTERVAL_MS)

    // Also refresh when the user returns to the tab/app
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAll()
      }
    }

    // Also refresh when device comes back online
    const handleOnline = () => {
      refreshAll()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("online", handleOnline)

    console.log("⏱️ AutoRefresh: active — refreshing every 5s and on tab focus.")

    return () => {
      clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("online", handleOnline)
    }
  }, [refreshAll])

  return null
}
