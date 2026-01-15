// Configuração global do Supabase para evitar múltiplas instâncias
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  storageKey: "biskate-auth-token",
  clientInfo: "biskate-web",
} as const

// Verificar se as variáveis de ambiente estão definidas
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  throw new Error("Missing required Supabase environment variables")
}
