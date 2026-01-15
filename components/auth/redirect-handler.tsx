"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface RedirectHandlerProps {
  to: string
  when: "authenticated" | "unauthenticated"
}

export function RedirectHandler({ to, when }: RedirectHandlerProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [redirectAttempted, setRedirectAttempted] = useState(false)

  useEffect(() => {
    // Esperar até que a autenticação seja verificada
    if (loading) return

    // Verificar condição de redirecionamento
    const shouldRedirect = (when === "authenticated" && user) || (when === "unauthenticated" && !user)

    if (shouldRedirect && !redirectAttempted) {
      console.log(`🔄 RedirectHandler: Redirecting to ${to}`)
      setRedirectAttempted(true)

      // Tentar múltiplas estratégias de redirecionamento
      try {
        // Estratégia 1: Next.js Router
        router.push(to)

        // Estratégia 2: Fallback com window.location após um pequeno delay
        setTimeout(() => {
          if (typeof window !== "undefined" && window.location.pathname !== to) {
            console.log("🔄 RedirectHandler: Fallback redirect using window.location")
            window.location.href = to
          }
        }, 500)
      } catch (err) {
        console.error("❌ RedirectHandler: Redirect error:", err)
        // Estratégia 3: Redirecionamento direto como último recurso
        if (typeof window !== "undefined") {
          window.location.href = to
        }
      }
    }
  }, [user, loading, to, when, router, redirectAttempted])

  return null
}
