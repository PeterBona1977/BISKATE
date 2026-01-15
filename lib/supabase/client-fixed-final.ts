import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Criar cliente Supabase com configurações otimizadas
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "X-Client-Info": "biskate-web",
    },
  },
})

// Função para verificar conexão
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("profiles").select("id").limit(1)
    if (error) {
      console.error("Supabase connection error:", error)
      return false
    }
    console.log("✅ Supabase connection successful")
    return true
  } catch (error) {
    console.error("Supabase connection failed:", error)
    return false
  }
}

// Função para obter perfil do utilizador atual
export async function getCurrentUserProfile() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    return profile
  } catch (error) {
    console.error("Error in getCurrentUserProfile:", error)
    return null
  }
}

// Função para verificar se utilizador é admin
export async function isCurrentUserAdmin() {
  try {
    const profile = await getCurrentUserProfile()
    return profile?.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

export default supabase
