"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; user?: User }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Variáveis globais para evitar múltiplas execuções
let globalInitialized = false
let globalSubscription: any = null

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Refs para controle local
  const mountedRef = useRef(true)
  const fetchingRef = useRef(false)

  // Função de fetch ultra-protegida
  const fetchProfile = async (userId: string) => {
    if (!mountedRef.current || fetchingRef.current) {
      console.log("🛑 FETCH BLOCKED")
      return
    }

    fetchingRef.current = true
    console.log("📋 FETCH START:", userId.slice(0, 8))

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (!mountedRef.current) return

      if (error) {
        console.log("❌ FETCH ERROR, using basic profile")
        const basicProfile: Profile = {
          id: userId,
          full_name: "Usuário",
          email: "",
          role: "client",
          plan: "free",
          responses_used: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfile(basicProfile)
      } else {
        console.log("✅ FETCH SUCCESS")
        setProfile(data)
      }
    } catch (err) {
      console.log("💥 FETCH EXCEPTION")
    } finally {
      fetchingRef.current = false
      console.log("🏁 FETCH END")
    }
  }

  // Inicialização global única
  useEffect(() => {
    if (globalInitialized) {
      console.log("🛑 GLOBAL INIT BLOCKED")
      setLoading(false)
      return
    }

    globalInitialized = true
    console.log("🚀 GLOBAL INIT START")

    const initialize = async () => {
      try {
        // Verificar sessão inicial
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user && mountedRef.current) {
          console.log("👤 INITIAL USER FOUND")
          setUser(session.user)
          await fetchProfile(session.user.id)
        }

        // Setup listener global único
        if (!globalSubscription) {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔔 AUTH EVENT:", event)

            if (!mountedRef.current) return

            if (event === "SIGNED_IN" && session?.user) {
              setUser(session.user)
              await fetchProfile(session.user.id)
            } else if (event === "SIGNED_OUT") {
              setUser(null)
              setProfile(null)
              fetchingRef.current = false
            }

            setLoading(false)
          })

          globalSubscription = subscription
        }
      } catch (error) {
        console.log("💥 INIT ERROR:", error)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
          console.log("🏁 GLOBAL INIT END")
        }
      }
    }

    initialize()

    // Cleanup
    return () => {
      console.log("🧹 COMPONENT CLEANUP")
      mountedRef.current = false
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log("🔐 SIGNIN:", email)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error }
      return { error: null, user: data.user }
    } catch (err) {
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      return { error }
    } catch (err) {
      return { error: err }
    }
  }

  const signOut = async () => {
    console.log("🚪 SIGNOUT")
    setUser(null)
    setProfile(null)
    fetchingRef.current = false
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (user) {
      fetchingRef.current = false
      await fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
