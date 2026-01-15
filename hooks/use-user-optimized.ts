"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export type UserDetails = {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "client" | "provider" | null
  avatar_url: string | null
  created_at: string | null
  plan: string | null
  responses_used: number | null
}

interface UseUserReturn {
  user: User | null
  userDetails: UserDetails | null
  isLoading: boolean
  error: string | null
  isAdmin: boolean
  isClient: boolean
  isProvider: boolean
  refreshUser: () => Promise<void>
  clearError: () => void
}

export function useUserOptimized(): UseUserReturn {
  const supabase = createClientComponentClient<Database>()
  const [user, setUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoized computed values
  const computedValues = useMemo(
    () => ({
      isAdmin: userDetails?.role === "admin",
      isClient: userDetails?.role === "client",
      isProvider: userDetails?.role === "provider",
    }),
    [userDetails?.role],
  )

  const fetchUserDetails = useCallback(
    async (userId: string) => {
      try {
        setError(null)

        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, avatar_url, created_at, plan, responses_used")
          .eq("id", userId)
          .single()

        if (error) {
          throw new Error(`Erro ao buscar perfil: ${error.message}`)
        }

        if (data) {
          setUserDetails(data as UserDetails)
        }
      } catch (err: any) {
        console.error("❌ Erro ao buscar detalhes do utilizador:", err)
        setError(err.message)
      }
    },
    [supabase],
  )

  const refreshUser = useCallback(async () => {
    if (user) {
      setIsLoading(true)
      await fetchUserDetails(user.id)
      setIsLoading(false)
    }
  }, [user, fetchUserDetails])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await fetchUserDetails(session.user.id)
        }
      } catch (err: any) {
        console.error("❌ Erro na inicialização:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setError(null)
        await fetchUserDetails(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setUserDetails(null)
        setError(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserDetails])

  return {
    user,
    userDetails,
    isLoading,
    error,
    refreshUser,
    clearError,
    ...computedValues,
  }
}
