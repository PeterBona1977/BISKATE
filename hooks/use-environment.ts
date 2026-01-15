"use client"

import { useEffect, useState } from "react"

export function useEnvironment() {
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Verificar se está em desenvolvimento baseado na URL
    const isDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname.includes("vercel.app") ||
        window.location.hostname.includes("v0.dev"))

    setIsDevelopment(isDev)
  }, [])

  return {
    isDevelopment,
    isClient,
    isProduction: isClient && !isDevelopment,
  }
}
