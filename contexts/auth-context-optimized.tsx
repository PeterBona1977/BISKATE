"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase, getCurrentUserProfile, clearProfileCache } from "@/lib/supabase/client-optimized"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAdmin: boolean
  isProvider: boolean
  isPremium: boolean
  retryConnection: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    try {
      setError(null)
      const userProfile = await getCurrentUserProfile(false) // Force fresh data
      setProfile(userProfile)
    } catch (error) {
      console.error("Error refreshing profile:", error)
      setError("Erro ao carregar perfil do utilizador")
      setProfile(null)
    }
  }, [user])

  const retryConnection = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        await refreshProfile()
      }
    } catch (error) {
      console.error("Error retrying connection:", error)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [refreshProfile])

  useEffect(() => {
    let mounted = true

    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        setError(null)
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          await refreshProfile()
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        if (mounted) {
          setError("Erro ao inicializar autenticação")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.email)

      try {
        setError(null)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Limpar cache ao fazer login
          if (event === "SIGNED_IN") {
            clearProfileCache()
          }
          await refreshProfile()
        } else {
          setProfile(null)
          clearProfileCache()
        }
      } catch (error) {
        console.error("Error handling auth state change:", error)
        if (mounted) {
          setError("Erro ao processar mudança de autenticação")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshProfile])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        setError(error.message)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Sign in exception:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        setError(error.message)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Sign up exception:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      clearProfileCache()
    } catch (error) {
      console.error("Sign out error:", error)
      setError("Erro ao fazer logout")
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = profile?.role === "admin"
  const isProvider = profile?.role === "provider" || profile?.role === "admin"
  const isPremium = profile?.plan === "premium" || profile?.role === "admin"

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin,
    isProvider,
    isPremium,
    retryConnection,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Hook para verificar permissões
export function usePermissions() {
  const { profile, isAdmin, isProvider, isPremium } = useAuth()

  return {
    canCreateGigs: !!profile,
    canManageUsers: isAdmin,
    canModerateContent: isAdmin,
    canAccessAnalytics: isAdmin || isPremium,
    canUseAdvancedFeatures: isPremium,
    canManageCategories: isAdmin,
    canViewAllGigs: isAdmin,
    canProcessPayments: isProvider,
    canCreateProposals: isProvider,
    canAccessProviderDashboard: isProvider,
  }
}
