// Exportações do cliente (browser)
export { supabase as clientSupabase } from "./client"

// Exportações do servidor
export { createServerSupabaseClient, supabase } from "./server"
export { getServerSupabase } from "./server-wrapper"

// Tipos
export type { Database } from "./database.types"

// Re-exportar tipos comuns do Supabase
export type {
  User,
  Session,
  AuthError,
  AuthResponse,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from "@supabase/supabase-js"
