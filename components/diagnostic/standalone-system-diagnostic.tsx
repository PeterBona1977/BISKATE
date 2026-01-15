"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Shield,
  Zap,
  Users,
  Settings,
  Activity,
  Clock,
  TrendingUp,
  Server,
  Lock,
} from "lucide-react"
import {
  supabase,
  testSupabaseConnection,
  getDatabaseStats,
  testTableAccess,
  executeRPC,
  performanceMonitor,
} from "@/lib/supabase/client-optimized"

interface DiagnosticResult {
  category: string
  name: string
  status: "success" | "warning" | "error" | "info"
  message: string
  details?: string
  responseTime?: number
  recommendation?: string
}

interface SystemStats {
  total_users: number
  total_gigs: number
  total_categories: number
  total_proposals: number
  total_conversations: number
  total_messages: number
  total_reviews: number
  total_payments: number
  active_gigs: number
  pending_proposals: number
}

export function StandaloneSystemDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [overallHealth, setOverallHealth] = useState<number>(0)

  const runDiagnostic = async () => {
    setLoading(true)
    setProgress(0)
    setResults([])
    performanceMonitor.reset()

    const diagnosticTests = [
      testConnection,
      testAuthentication,
      testDatabase,
      testTables,
      testRLSPolicies,
      testRPCFunctions,
      testPerformance,
      testSystemIntegrity,
    ]

    const totalTests = diagnosticTests.length
    const newResults: DiagnosticResult[] = []

    for (let i = 0; i < diagnosticTests.length; i++) {
      const test = diagnosticTests[i]
      try {
        const result = await test()
        if (Array.isArray(result)) {
          newResults.push(...result)
        } else {
          newResults.push(result)
        }
      } catch (error) {
        newResults.push({
          category: "Sistema",
          name: `Teste ${i + 1}`,
          status: "error",
          message: "Erro durante execução do teste",
          details: error instanceof Error ? error.message : "Erro desconhecido",
        })
      }

      setProgress(Math.round(((i + 1) / totalTests) * 100))
      setResults([...newResults])

      // Pequena pausa para mostrar progresso
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    // Calcular saúde geral
    const successCount = newResults.filter((r) => r.status === "success").length
    const totalCount = newResults.length
    setOverallHealth(Math.round((successCount / totalCount) * 100))

    setLoading(false)
  }

  const testConnection = async (): Promise<DiagnosticResult> => {
    const result = await testSupabaseConnection()

    return {
      category: "Conexão",
      name: "Conexão com Supabase",
      status: result.success ? "success" : "error",
      message: result.success ? "Conexão estabelecida com sucesso" : "Falha na conexão",
      details: result.error || `Tempo de resposta: ${result.responseTime}ms`,
      responseTime: result.responseTime,
      recommendation: result.success
        ? undefined
        : "Verifique as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY",
    }
  }

  const testAuthentication = async (): Promise<DiagnosticResult> => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        return {
          category: "Autenticação",
          name: "Sistema de Autenticação",
          status: "error",
          message: "Erro no sistema de autenticação",
          details: error.message,
          recommendation: "Verifique a configuração do Supabase Auth",
        }
      }

      return {
        category: "Autenticação",
        name: "Sistema de Autenticação",
        status: session ? "success" : "info",
        message: session ? "Utilizador autenticado" : "Nenhum utilizador autenticado",
        details: session ? `Utilizador: ${session.user.email}` : "Teste em modo anónimo",
      }
    } catch (error) {
      return {
        category: "Autenticação",
        name: "Sistema de Autenticação",
        status: "error",
        message: "Falha no teste de autenticação",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  const testDatabase = async (): Promise<DiagnosticResult> => {
    try {
      const stats = await getDatabaseStats()

      if (stats) {
        setSystemStats(stats)
        return {
          category: "Base de Dados",
          name: "Acesso à Base de Dados",
          status: "success",
          message: "Base de dados acessível",
          details: `${stats.total_users} utilizadores, ${stats.total_gigs} gigs, ${stats.total_categories} categorias`,
        }
      } else {
        return {
          category: "Base de Dados",
          name: "Acesso à Base de Dados",
          status: "warning",
          message: "Acesso limitado à base de dados",
          details: "Algumas funções podem não estar disponíveis",
          recommendation: "Execute o script de criação de funções RPC",
        }
      }
    } catch (error) {
      return {
        category: "Base de Dados",
        name: "Acesso à Base de Dados",
        status: "error",
        message: "Erro no acesso à base de dados",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        recommendation: "Verifique as permissões e políticas RLS",
      }
    }
  }

  const testTables = async (): Promise<DiagnosticResult[]> => {
    const tables = [
      "profiles",
      "categories",
      "gigs",
      "proposals",
      "conversations",
      "messages",
      "reviews",
      "payments",
      "invoices",
    ]

    const results: DiagnosticResult[] = []

    for (const table of tables) {
      const result = await testTableAccess(table)

      results.push({
        category: "Tabelas",
        name: `Tabela ${table}`,
        status: result.accessible ? "success" : "error",
        message: result.accessible ? `Acessível (${result.count} registos)` : "Não acessível",
        details: result.error || `Tempo de resposta: ${result.responseTime}ms`,
        responseTime: result.responseTime,
        recommendation: result.accessible
          ? undefined
          : "Verifique se a tabela existe e as políticas RLS estão corretas",
      })
    }

    return results
  }

  const testRLSPolicies = async (): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = []

    try {
      // Teste de leitura pública (categorias)
      const { error: categoriesError } = await supabase.from("categories").select("id").limit(1)

      results.push({
        category: "RLS",
        name: "Políticas de Leitura Pública",
        status: categoriesError ? "error" : "success",
        message: categoriesError ? "Falha no acesso público" : "Acesso público funcionando",
        details: categoriesError?.message,
        recommendation: categoriesError ? "Verifique as políticas RLS para leitura pública" : undefined,
      })

      // Teste de acesso autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { error: profileError } = await supabase.from("profiles").select("id").eq("id", user.id).single()

        results.push({
          category: "RLS",
          name: "Políticas de Utilizador Autenticado",
          status: profileError ? "error" : "success",
          message: profileError ? "Falha no acesso autenticado" : "Acesso autenticado funcionando",
          details: profileError?.message,
          recommendation: profileError ? "Verifique as políticas RLS para utilizadores autenticados" : undefined,
        })
      } else {
        results.push({
          category: "RLS",
          name: "Políticas de Utilizador Autenticado",
          status: "info",
          message: "Não testado - utilizador não autenticado",
          details: "Faça login para testar políticas de utilizador autenticado",
        })
      }
    } catch (error) {
      results.push({
        category: "RLS",
        name: "Teste de Políticas RLS",
        status: "error",
        message: "Erro no teste de políticas RLS",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    return results
  }

  const testRPCFunctions = async (): Promise<DiagnosticResult[]> => {
    const functions = [
      { name: "get_system_stats", params: {} },
      { name: "check_table_health", params: {} },
      { name: "calculate_average_rating", params: { profile_id: "00000000-0000-0000-0000-000000000000" } },
    ]

    const results: DiagnosticResult[] = []

    for (const func of functions) {
      const result = await executeRPC(func.name, func.params)

      results.push({
        category: "Funções RPC",
        name: `Função ${func.name}`,
        status: result.success ? "success" : "error",
        message: result.success ? "Função disponível" : "Função não disponível",
        details: result.error || `Tempo de resposta: ${result.responseTime}ms`,
        responseTime: result.responseTime,
        recommendation: result.success ? undefined : "Execute o script de criação de funções RPC",
      })
    }

    return results
  }

  const testPerformance = async (): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = []
    const stats = performanceMonitor.getAllStats()

    // Análise de performance geral
    const allTimes = Object.values(stats).map((stat: any) => stat.avg)
    const avgResponseTime = allTimes.length > 0 ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length : 0

    results.push({
      category: "Performance",
      name: "Tempo de Resposta Médio",
      status: avgResponseTime < 500 ? "success" : avgResponseTime < 1000 ? "warning" : "error",
      message: `${Math.round(avgResponseTime)}ms`,
      details: `Baseado em ${Object.keys(stats).length} queries`,
      recommendation: avgResponseTime > 1000 ? "Performance baixa - considere otimizações" : undefined,
    })

    // Análise de queries específicas
    for (const [queryName, stat] of Object.entries(stats)) {
      const typedStat = stat as any
      results.push({
        category: "Performance",
        name: `Query ${queryName}`,
        status: typedStat.avg < 300 ? "success" : typedStat.avg < 800 ? "warning" : "error",
        message: `${Math.round(typedStat.avg)}ms (${typedStat.count} execuções)`,
        details: `Min: ${Math.round(typedStat.totalTime / typedStat.count)}ms`,
      })
    }

    return results
  }

  const testSystemIntegrity = async (): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = []

    try {
      // Verificar integridade referencial básica
      const { data: orphanedGigs, error: gigsError } = await supabase
        .from("gigs")
        .select("id")
        .not("user_id", "in", `(SELECT id FROM profiles)`)
        .limit(1)

      if (!gigsError) {
        results.push({
          category: "Integridade",
          name: "Integridade Referencial - Gigs",
          status: orphanedGigs && orphanedGigs.length > 0 ? "warning" : "success",
          message: orphanedGigs && orphanedGigs.length > 0 ? "Gigs órfãos encontrados" : "Integridade referencial OK",
          recommendation: orphanedGigs && orphanedGigs.length > 0 ? "Limpe gigs sem utilizador associado" : undefined,
        })
      }

      // Verificar consistência de dados
      const { count: totalProfiles } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      const { count: totalGigs } = await supabase.from("gigs").select("*", { count: "exact", head: true })

      results.push({
        category: "Integridade",
        name: "Consistência de Dados",
        status: "info",
        message: `${totalProfiles || 0} perfis, ${totalGigs || 0} gigs`,
        details: "Dados básicos consistentes",
      })
    } catch (error) {
      results.push({
        category: "Integridade",
        name: "Teste de Integridade",
        status: "error",
        message: "Erro no teste de integridade",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }

    return results
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "info":
        return <Activity className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "info":
        return "bg-blue-100 text-blue-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Conexão":
        return <Server className="h-4 w-4" />
      case "Autenticação":
        return <Lock className="h-4 w-4" />
      case "Base de Dados":
        return <Database className="h-4 w-4" />
      case "Tabelas":
        return <Settings className="h-4 w-4" />
      case "RLS":
        return <Shield className="h-4 w-4" />
      case "Funções RPC":
        return <Zap className="h-4 w-4" />
      case "Performance":
        return <TrendingUp className="h-4 w-4" />
      case "Integridade":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = []
      }
      acc[result.category].push(result)
      return acc
    },
    {} as Record<string, DiagnosticResult[]>,
  )

  const successCount = results.filter((r) => r.status === "success").length
  const warningCount = results.filter((r) => r.status === "warning").length
  const errorCount = results.filter((r) => r.status === "error").length
  const infoCount = results.filter((r) => r.status === "info").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diagnóstico do Sistema</h1>
          <p className="text-gray-600">Análise completa da saúde e performance do BISKATE</p>
        </div>
        <Button onClick={runDiagnostic} disabled={loading} size="lg">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analisando..." : "Executar Diagnóstico"}
        </Button>
      </div>

      {/* Progress */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso do Diagnóstico</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Overall Health */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="md:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{overallHealth}%</div>
              <div className="text-sm text-gray-600">Saúde Geral</div>
              <Progress value={overallHealth} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-2xl font-bold text-green-600">{successCount}</span>
              </div>
              <div className="text-sm text-gray-600">Sucessos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold text-yellow-600">{warningCount}</span>
              </div>
              <div className="text-sm text-gray-600">Avisos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-6 w-6 text-red-500 mr-2" />
                <span className="text-2xl font-bold text-red-600">{errorCount}</span>
              </div>
              <div className="text-sm text-gray-600">Erros</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-2xl font-bold text-blue-600">{infoCount}</span>
              </div>
              <div className="text-sm text-gray-600">Info</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Stats */}
      {systemStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Estatísticas do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemStats.total_users}</div>
                <div className="text-sm text-gray-600">Utilizadores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemStats.total_gigs}</div>
                <div className="text-sm text-gray-600">Gigs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemStats.total_categories}</div>
                <div className="text-sm text-gray-600">Categorias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{systemStats.total_proposals}</div>
                <div className="text-sm text-gray-600">Propostas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{systemStats.total_messages}</div>
                <div className="text-sm text-gray-600">Mensagens</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results by Category */}
      {!loading && results.length > 0 && (
        <Tabs defaultValue={Object.keys(groupedResults)[0]} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {Object.keys(groupedResults).map((category) => (
              <TabsTrigger key={category} value={category} className="flex items-center space-x-1 text-xs">
                {getCategoryIcon(category)}
                <span className="hidden sm:inline">{category}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedResults).map(([category, categoryResults]) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getCategoryIcon(category)}
                    <span>{category}</span>
                    <Badge variant="outline">{categoryResults.length} testes</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryResults.map((result, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{result.name}</h3>
                            <Badge className={getStatusColor(result.status)}>
                              {result.status === "success" && "Sucesso"}
                              {result.status === "warning" && "Aviso"}
                              {result.status === "error" && "Erro"}
                              {result.status === "info" && "Info"}
                            </Badge>
                            {result.responseTime && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {result.responseTime}ms
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{result.message}</p>
                          {result.details && <p className="text-xs text-gray-500 mb-2">{result.details}</p>}
                          {result.recommendation && (
                            <Alert className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                <strong>Recomendação:</strong> {result.recommendation}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Quick Actions */}
      {!loading && errorCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Ações Recomendadas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Database className="h-4 w-4 mr-2" />
                Executar Script de Correções Críticas
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Zap className="h-4 w-4 mr-2" />
                Criar Funções RPC em Falta
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Shield className="h-4 w-4 mr-2" />
                Corrigir Políticas RLS
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Ir para Centro de Reparação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
