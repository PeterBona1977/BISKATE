import { createServerSupabaseClient } from "./server"

// Função helper para usar em Server Components e API Routes
export function getServerSupabase() {
  return createServerSupabaseClient()
}

// Para compatibilidade com código existente
export const supabase = getServerSupabase
