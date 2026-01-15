"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!(user && session)

  // Create mock profile based on user data
  const createMockProfile = (user: User): Profile => {
    return {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      role: user.email === "pmbonanca@gmail.com" ? "admin" : "client",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log("Fetching profile for user:", userId)

      // Use a simple query that shouldn't cause recursion
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role, created_at, updated_at")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Profile fetch error:", error)

        // If it's a recursion error or profile doesn't exist, create/use mock
        if (
          error.message?.includes("infinite recursion") ||
          error.message?.includes("recursion") ||
          error.code === "PGRST116"
        ) {
          console.log("Using mock profile due to error:", error.message)
          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            const mockProfile = createMockProfile(userData.user)
            // Try to create the profile in the database
            await createProfileSafely(mockProfile)
            return mockProfile
          }
        }
        return null
      }

      console.log("Profile fetched successfully:", data)
      return data
    } catch (err) {
      console.error("Exception in fetchProfile:", err)

      // Always fallback to mock profile
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        return createMockProfile(userData.user)
      }
      return null
    }
  }

  const createProfileSafely = async (profileData: Profile): Promise<void> => {
    try {
      console.log("Attempting to create profile safely:", profileData.email)

      const { error } = await supabase.from("profiles").upsert(
        {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          role: profileData.role,
        },
        {
          onConflict: "id",
        },
      )

      if (error) {
        console.error("Profile creation error (ignored):", error)
        // Don't throw - we'll use the mock profile anyway
      } else {
        console.log("Profile created/updated successfully")
      }
    } catch (err) {
      console.error("Exception in createProfileSafely (ignored):", err)
      // Don't throw - we'll use the mock profile anyway
    }
  }

  const initializeAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Initializing auth...")

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        setError(sessionError.message)
        return
      }

      console.log("Session retrieved:", session?.user?.email || "No session")

      if (session?.user) {
        setUser(session.user)
        setSession(session)

        // Always use mock profile as primary, try to sync with DB in background
        const mockProfile = createMockProfile(session.user)
        setProfile(mockProfile)

        // Try to fetch/create real profile in background
        fetchProfile(session.user.id)
          .then((realProfile) => {
            if (realProfile) {
              setProfile(realProfile)
            }
          })
          .catch((err) => {
            console.error("Background profile fetch failed:", err)
            // Keep using mock profile
          })
      }
    } catch (err) {
      console.error("Auth initialization error:", err)
      setError("Erro na inicialização da autenticação")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.email || "No user")

      if (session?.user) {
        setUser(session.user)
        setSession(session)
        setError(null)

        // Always use mock profile immediately
        const mockProfile = createMockProfile(session.user)
        if (mounted) {
          setProfile(mockProfile)
        }

        // Try to fetch real profile in background
        fetchProfile(session.user.id)
          .then((realProfile) => {
            if (mounted && realProfile) {
              setProfile(realProfile)
            }
          })
          .catch((err) => {
            console.error("Background profile fetch failed:", err)
            // Keep using mock profile
          })
      } else {
        setUser(null)
        setSession(null)
        setProfile(null)
        setError(null)
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Attempting sign in for:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        setError(error.message)
        return { error }
      }

      console.log("Sign in successful for:", data.user?.email)
      return { error: null }
    } catch (err) {
      console.error("Exception in signIn:", err)
      const errorMessage = err instanceof Error ? err.message : "Erro no login"
      setError(errorMessage)
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Attempting sign up for:", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        setError(error.message)
        return { error }
      }

      console.log("Sign up successful for:", data.user?.email)
      return { error: null }
    } catch (err) {
      console.error("Exception in signUp:", err)
      const errorMessage = err instanceof Error ? err.message : "Erro no registo"
      setError(errorMessage)
      return { error: { message: errorMessage } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      console.log("Signing out...")

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
        setError(error.message)
      } else {
        setUser(null)
        setProfile(null)
        setSession(null)
        setError(null)
        console.log("Sign out successful")
      }
    } catch (err) {
      console.error("Exception in signOut:", err)
      setError(err instanceof Error ? err.message : "Erro ao sair")
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        const profileData = await fetchProfile(user.id)
        setProfile(profileData || createMockProfile(user))
      } catch (err) {
        console.error("Error refreshing profile:", err)
        setProfile(createMockProfile(user))
      }
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    refreshProfile,
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
