import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase/database.types"

// Garantir que todas as constantes estão devidamente inicializadas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables")
}

// Chave única para o storage
const STORAGE_KEY = "biskate-supabase-auth"

// Usar uma chave única no globalThis para evitar conflitos
const GLOBAL_KEY = "__biskate_supabase_client__"

// Função para criar o cliente apenas uma vez
function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey: STORAGE_KEY,
      flowType: "pkce",
    },
    global: {
      headers: {
        "X-Client-Info": `biskate-web-${Date.now()}`,
      },
    },
    db: {
      schema: "public",
    },
  })
}

// Garantir uma única instância global usando uma chave específica
const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    // No servidor, sempre criar uma nova instância
    return createSupabaseClient()
  }

  // No cliente, usar a instância global com chave específica
  if (!(globalThis as any)[GLOBAL_KEY]) {
    ;(globalThis as any)[GLOBAL_KEY] = createSupabaseClient()

    // Debug apenas em desenvolvimento
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      console.log("🔧 Supabase client created:", GLOBAL_KEY)
    }
  }

  return (globalThis as any)[GLOBAL_KEY]
}

// Export the client instance with consistent naming
export const supabase = getSupabaseClient()
export const supabaseClient = getSupabaseClient()

// Debug info function
export const getInstanceInfo = () => {
  return {
    instanceId: `client-${Date.now()}`,
    initialized: true,
  }
}

// Reset function
export const resetSupabaseClient = () => {
  if (typeof window !== "undefined") {
    delete (globalThis as any)[GLOBAL_KEY]
  }
}

// Check instances function
export const checkSupabaseInstances = () => {
  if (typeof window === "undefined") return { count: 0, keys: [] }

  const keys = Object.keys(globalThis).filter((key) => key.includes("supabase") || key.includes("gotrue"))

  return { count: keys.length, keys }
}

export type { Database }
