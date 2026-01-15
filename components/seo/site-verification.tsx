"use client"

import { useEffect } from "react"

interface VerificationMeta {
  google?: string
  bing?: string
  yandex?: string
  pinterest?: string
  facebook?: string
}

export function SiteVerification() {
  useEffect(() => {
    // Only access environment variables on the server side
    // These should be handled in layout.tsx or a server component
  }, [])

  return null
}
