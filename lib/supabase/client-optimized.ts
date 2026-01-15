import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente Supabase otimizado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-client-info": "biskate-web@1.0.0",
    },
  },
})

// Cache para perfis de utilizador
const profileCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Monitor de performance
export const performanceMonitor = {
  queries: new Map<string, { count: number; totalTime: number; avg: number }>(),

  startQuery: (queryName: string) => {
    return Date.now()
  },

  endQuery: (queryName: string, startTime: number) => {
    const duration = Date.now() - startTime
    const existing = performanceMonitor.queries.get(queryName) || { count: 0, totalTime: 0, avg: 0 }

    existing.count++
    existing.totalTime += duration
    existing.avg = existing.totalTime / existing.count

    performanceMonitor.queries.set(queryName, existing)

    return duration
  },

  getStats: (queryName: string) => {
    return performanceMonitor.queries.get(queryName)
  },

  getAllStats: () => {
    return Object.fromEntries(performanceMonitor.queries)
  },

  reset: () => {
    performanceMonitor.queries.clear()
  },
}

// Função para testar conexão
export async function testSupabaseConnection() {
  const startTime = performanceMonitor.startQuery("connection-test")

  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1).single()

    const responseTime = performanceMonitor.endQuery("connection-test", startTime)

    if (error && error.code !== "PGRST116") {
      return {
        success: false,
        error: error.message,
        responseTime,
      }
    }

    return {
      success: true,
      responseTime,
      message: "Conexão estabelecida com sucesso",
    }
  } catch (error) {
    performanceMonitor.endQuery("connection-test", startTime)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      responseTime: 0,
    }
  }
}

// Função para obter perfil do utilizador com cache
export async function getCurrentUserProfile(useCache = true) {
  const startTime = performanceMonitor.startQuery("get-profile")

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      performanceMonitor.endQuery("get-profile", startTime)
      return null
    }

    // Verificar cache
    if (useCache) {
      const cached = profileCache.get(user.id)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        performanceMonitor.endQuery("get-profile", startTime)
        return cached.data
      }
    }

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    performanceMonitor.endQuery("get-profile", startTime)

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    // Atualizar cache
    if (profile) {
      profileCache.set(user.id, {
        data: profile,
        timestamp: Date.now(),
      })
    }

    return profile
  } catch (error) {
    performanceMonitor.endQuery("get-profile", startTime)
    console.error("Exception in getCurrentUserProfile:", error)
    return null
  }
}

// Função para limpar cache
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId)
  } else {
    profileCache.clear()
  }
}

// Função para obter estatísticas da base de dados com fallback
export async function getDatabaseStats() {
  const startTime = performanceMonitor.startQuery("database-stats")

  try {
    // Tentar usar função RPC primeiro
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_system_stats")

    if (!rpcError && rpcData) {
      performanceMonitor.endQuery("database-stats", startTime)
      return rpcData
    }

    // Fallback: queries diretas se RPC não funcionar
    console.warn("RPC get_system_stats não disponível, usando queries diretas")

    const [
      { count: profilesCount },
      { count: gigsCount },
      { count: categoriesCount },
      { count: proposalsCount },
      { count: conversationsCount },
      { count: messagesCount },
      { count: reviewsCount },
      { count: paymentsCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("gigs").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("proposals").select("*", { count: "exact", head: true }),
      supabase.from("conversations").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("*", { count: "exact", head: true }),
    ])

    const stats = {
      total_users: profilesCount || 0,
      total_gigs: gigsCount || 0,
      total_categories: categoriesCount || 0,
      total_proposals: proposalsCount || 0,
      total_conversations: conversationsCount || 0,
      total_messages: messagesCount || 0,
      total_reviews: reviewsCount || 0,
      total_payments: paymentsCount || 0,
      active_gigs: 0, // Será calculado separadamente se necessário
      pending_proposals: 0,
    }

    performanceMonitor.endQuery("database-stats", startTime)
    return stats
  } catch (error) {
    performanceMonitor.endQuery("database-stats", startTime)
    console.error("Exception in getDatabaseStats:", error)
    return null
  }
}

// Função para testar acesso a tabelas
export async function testTableAccess(tableName: string) {
  const startTime = performanceMonitor.startQuery(`table-${tableName}`)

  try {
    const { data, error, count } = await supabase.from(tableName).select("*", { count: "exact", head: true }).limit(1)

    const responseTime = performanceMonitor.endQuery(`table-${tableName}`, startTime)

    if (error) {
      return {
        accessible: false,
        error: error.message,
        hasData: false,
        count: 0,
        responseTime,
      }
    }

    return {
      accessible: true,
      hasData: (count || 0) > 0,
      count: count || 0,
      responseTime,
    }
  } catch (error) {
    performanceMonitor.endQuery(`table-${tableName}`, startTime)
    return {
      accessible: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      hasData: false,
      count: 0,
      responseTime: 0,
    }
  }
}

// Função para executar RPC com tratamento de erro
export async function executeRPC(functionName: string, params: any = {}) {
  const startTime = performanceMonitor.startQuery(`rpc-${functionName}`)

  try {
    const { data, error } = await supabase.rpc(functionName, params)

    const responseTime = performanceMonitor.endQuery(`rpc-${functionName}`, startTime)

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
        responseTime,
      }
    }

    return {
      success: true,
      data,
      responseTime,
    }
  } catch (error) {
    performanceMonitor.endQuery(`rpc-${functionName}`, startTime)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      data: null,
      responseTime: 0,
    }
  }
}

// Função para verificar se tabela existe
export async function checkTableExists(tableName: string) {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    return !error && !!data
  } catch {
    return false
  }
}

// Função para verificar saúde do sistema
export async function checkSystemHealth() {
  const results = {
    connection: false,
    authentication: false,
    database: false,
    rls: false,
    performance: 0,
  }

  // Teste de conexão
  const connectionTest = await testSupabaseConnection()
  results.connection = connectionTest.success

  // Teste de autenticação
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    results.authentication = !!session
  } catch {
    results.authentication = false
  }

  // Teste de base de dados
  const dbStats = await getDatabaseStats()
  results.database = !!dbStats

  // Teste de RLS
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from("profiles").select("id").eq("id", user.id).single()
      results.rls = !error
    }
  } catch {
    results.rls = false
  }

  // Calcular performance média
  const allStats = performanceMonitor.getAllStats()
  const avgTimes = Object.values(allStats).map((stat: any) => stat.avg)
  results.performance = avgTimes.length > 0 ? avgTimes.reduce((sum, time) => sum + time, 0) / avgTimes.length : 0

  return results
}

export default supabase
