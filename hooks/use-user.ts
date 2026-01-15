"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"
import { useAuth } from "@/contexts/auth-context"

export type UserDetails = {
  id: string
  email: string
  name: string | null
  role: "admin" | "client" | "provider" | null
  avatar_url: string | null
  created_at: string | null
}

export function useUser() {
  const { user, profile, loading } = useAuth()
  const supabase = createClientComponentClient<Database>()
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(loading)

  useEffect(() => {
    if (user && !profile) {
      const getUserDetails = async () => {
        setIsLoading(true)
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, email, full_name, role, created_at")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error fetching user details:", error)
          } else if (data) {
            // Mapeando para a interface esperada
            setUserDetails({
              id: data.id,
              email: data.email,
              name: data.full_name || data.email?.split("@")[0] || null, // full_name ou fallback
              role: data.role === "admin" ? "admin" : data.role === "user" ? "client" : null, // Mapeando roles
              avatar_url: null, // Não existe na tabela, sempre null
              created_at: data.created_at,
            } as UserDetails)
          }
        } catch (error) {
          console.error("Error in useUser hook:", error)
        } finally {
          setIsLoading(false)
        }
      }

      getUserDetails()
    }
  }, [user, profile, loading, supabase])

  return {
    user,
    profile: userDetails,
    loading: isLoading,
    isAuthenticated: !!user,
    isAdmin: userDetails?.role === "admin",
    isClient: userDetails?.role === "client",
    isProvider: userDetails?.role === "provider",
  }
}
