"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client-fixed"

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin" | "provider"
  phone: string | null
  location: string | null
  plan: "free" | "essential" | "pro" | "unlimited"
  responses_used: number
  responses_reset_date: string
  created_at: string
  updated_at: string | null
  bio: string | null
  is_provider: boolean
  provider_status: "inactive" | "pending" | "approved" | "rejected" | "suspended" | null
  avatar_url: string | null
  website: string | null
  social_links: any
  average_rating: number | null
  total_reviews: number | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  isProvider: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  console.log("🚀 AuthProvider inicializado")

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log("🔍 Buscando perfil para:", userId)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("❌ Erro ao buscar perfil:", error)
        return null
      }

      console.log("✅ Perfil encontrado:", data)
      return data as Profile
    } catch (error) {
      console.error("💥 Erro na função fetchProfile:", error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const newProfile = await fetchProfile(user.id)
      setProfile(newProfile)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error)
    }
  }

  useEffect(() => {
    if (initialized) return

    console.log("🔄 Inicializando auth listener...")

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("❌ Erro ao obter sessão inicial:", error)
      } else {
        console.log("📱 Sessão inicial:", session ? "Encontrada" : "Não encontrada")
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          fetchProfile(session.user.id).then(setProfile)
        }
      }
      setLoading(false)
      setInitialized(true)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", event)

      if (event === "SIGNED_IN" && session) {
        console.log("✅ Signed in:", session.user.id)
        setSession(session)
        setUser(session.user)
        const userProfile = await fetchProfile(session.user.id)
        setProfile(userProfile)
      } else if (event === "SIGNED_OUT") {
        console.log("👋 Signed out")
        setSession(null)
        setUser(null)
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialized])

  const isAdmin = profile?.role === "admin"
  const isProvider = profile?.is_provider === true

  console.log("👑 Status admin:", isAdmin)
  console.log("🔧 Status prestador:", isProvider)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        isProvider,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
