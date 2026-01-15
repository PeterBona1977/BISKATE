"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Database, RefreshCw, Shield, Activity } from "lucide-react"
import {
  supabase,
  testSupabaseConnection,
  getCurrentUserProfile,
  getDatabaseStats,
  testTableAccess,
  executeRPC,
  performanceMonitor,
} from "@/lib/supabase/client-optimized"
import { useAuth } from "@/contexts/auth-context-optimized"

interface DiagnosticResult {
  id: string
  name: string
  status: "success" | "warning" | "error" | "testing"
  message: string
  details?: any
  recommendations?: string[]
  responseTime?: number
  lastTested: Date
}

export function EnhancedSystemDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [overallHealth, setOverallHealth] = useState(0)
  const { user, profile, error: authError, retryConnection } = useAuth()

  const runDiagnostic = async () => {
    setLoading(true)
    const diagnosticResults: DiagnosticResult[] = []

    // 1. Teste de Conexão
    const connectionTest = await testConnection()
    diagnosticResults.push(connectionTest)

    // 2. Teste de Autenticação
    const authTest = await testAuthentication()
    diagnosticResults.push(authTest)

    // 3. Teste de Perfil
    const profileTest = await testProfile()
    diagnosticResults.push(profileTest)

    // 4. Teste de Tabelas
    const tablesTest = await testTables()
    diagnosticResults.push(...tablesTest)

    // 5. Teste de RLS
    const rlsTest = await testRLS()
    diagnosticResults.push(rlsTest)

    // 6. Teste de Performance
    const performanceTest = await testPerformance()
    diagnosticResults.push(performanceTest)

    // 7. Teste de Funções RPC
    const rpcTest = await testRPCFunctions()
    diagnosticResults.push(rpcTest)

    setResults(diagnosticResults)
    calculateOverallHealth(diagnosticResults)
    setLoading(false)
  }

  const testConnection = async (): Promise<DiagnosticResult> => {
    const startTime = performanceMonitor.startQuery("connection-test")

    try {
      const result = await testSupabaseConnection()
      const responseTime = performanceMonitor.endQuery("connection-test", startTime)

      return {
        id: "connection",
        name: "Conexão Base de Dados",
        status: result.success ? "success" : "error",
        message: result.success ? `Conectado em ${result.responseTime}ms` : `Falha: ${result.error}`,
        responseTime: result.responseTime,
        lastTested: new Date(),
        recommendations: result.success
          ? []
          : [
              "Verificar variáveis de ambiente",
              "Confirmar URL e chaves do Supabase",
              "Verificar conectividade de rede",
            ],
      }
    } catch (error) {
      performanceMonitor.endQuery("connection-test", startTime)
      return {
        id: "connection",
        name: "Conexão Base de Dados",
        status: "error",
        message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
        lastTested: new Date(),
        recommendations: ["Verificar configuração do Supabase"],
      }
    }
  }

  const testAuthentication = async (): Promise<DiagnosticResult> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      return {
        id: "authentication",
        name: "Sistema de Autenticação",
        status: session ? "success" : "warning",
        message: session ? `Utilizador autenticado: ${session.user.email}` : "Nenhum utilizador autenticado",
        details: {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          authError: authError,
        },
        lastTested: new Date(),
        recommendations: !session
          ? ["Fazer login para testar funcionalidades completas", "Verificar fluxo de autenticação"]
          : [],
      }
    } catch (error) {
      return {
        id: "authentication",
        name: "Sistema de Autenticação",
        status: "error",
        message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
        lastTested: new Date(),
        recommendations: ["Verificar configuração de autenticação"],
      }
    }
  }

  const testProfile = async (): Promise<DiagnosticResult> => {
    try {
      if (!user) {
        return {
          id: "profile",
          name: "Perfil do Utilizador",
          status: "warning",
          message: "Utilizador não autenticado",
          lastTested: new Date(),
        }
      }

      const userProfile = await getCurrentUserProfile(false)

      return {
        id: "profile",
        name: "Perfil do Utilizador",
        status: userProfile ? "success" : "error",
        message: userProfile
          ? `Perfil carregado: ${userProfile.full_name || userProfile.email} (${userProfile.role})`
          : "Erro ao carregar perfil",
        details: userProfile,
        lastTested: new Date(),
        recommendations: !userProfile
          ? ["Verificar políticas RLS da tabela profiles", "Confirmar se perfil existe na base de dados"]
          : [],
      }
    } catch (error) {
      return {
        id: "profile",
        name: "Perfil do Utilizador",
        status: "error",
        message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
        lastTested: new Date(),
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
      "notifications",
    ]

    const results: DiagnosticResult[] = []

    for (const tableName of tables) {
      const startTime = performanceMonitor.startQuery(`table-${tableName}`)

      try {
        const result = await testTableAccess(tableName)
        const responseTime = performanceMonitor.endQuery(`table-${tableName}`, startTime)

        let status: "success" | "warning" | "error" = "success"
        let message = `Tabela acessível`

        if (!result.accessible) {
          status = "error"
          message = `Erro: ${result.error}`
        } else if (!result.hasData) {
          status = "warning"
          message = "Tabela vazia"
        } else {
          message = "Tabela acessível com dados"
        }

        results.push({
          id: `table-${tableName}`,
          name: `Tabela: ${tableName}`,
          status,
          message,
          responseTime,
          details: result,
          lastTested: new Date(),
          recommendations: !result.accessible
            ? ["Verificar se tabela existe", "Confirmar políticas RLS", "Executar scripts de criação"]
            : [],
        })
      } catch (error) {
        performanceMonitor.endQuery(`table-${tableName}`, startTime)
        results.push({
          id: `table-${tableName}`,
          name: `Tabela: ${tableName}`,
          status: "error",
          message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
          lastTested: new Date(),
        })
      }
    }

    return results
  }

  const testRLS = async (): Promise<DiagnosticResult> => {
    try {
      if (!user) {
        return {
          id: "rls",
          name: "Políticas RLS",
          status: "warning",
          message: "Não é possível testar sem autenticação",
          lastTested: new Date(),
        }
      }

      // Testar acesso próprio
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      return {
        id: "rls",
        name: "Políticas RLS",
        status: error ? "error" : "success",
        message: error ? `RLS bloqueando acesso: ${error.message}` : "RLS funcionando corretamente",
        details: { data, error },
        lastTested: new Date(),
        recommendations: error
          ? ["Revisar políticas RLS", "Verificar permissões de utilizador", "Executar script de correção RLS"]
          : [],
      }
    } catch (error) {
      return {
        id: "rls",
        name: "Políticas RLS",
        status: "error",
        message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
        lastTested: new Date(),
      }
    }
  }

  const testPerformance = async (): Promise<DiagnosticResult> => {
    try {
      const stats = await getDatabaseStats()
      const allStats = performanceMonitor.getAllStats()

      const avgResponseTime =
        Object.values(allStats).reduce((sum: number, stat: any) => sum + stat.avg, 0) / Object.keys(allStats).length ||
        0

      let status: "success" | "warning" | "error" = "success"
      let message = `Performance boa (${Math.round(avgResponseTime)}ms médio)`

      if (avgResponseTime > 1000) {
        status = "warning"
        message = `Performance lenta (${Math.round(avgResponseTime)}ms médio)`
      } else if (avgResponseTime > 2000) {
        status = "error"
        message = `Performance crítica (${Math.round(avgResponseTime)}ms médio)`
      }

      return {
        id: "performance",
        name: "Performance da Base de Dados",
        status,
        message,
        details: { stats, performanceStats: allStats, avgResponseTime },
        lastTested: new Date(),
        recommendations:
          avgResponseTime > 1000
            ? ["Otimizar queries lentas", "Adicionar índices necessários", "Verificar carga do servidor"]
            : [],
      }
    } catch (error) {
      return {
        id: "performance",
        name: "Performance da Base de Dados",
        status: "error",
        message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
        lastTested: new Date(),
      }
    }
  }

  const testRPCFunctions = async (): Promise<DiagnosticResult> => {
    try {
      const testUserId = user?.id || "00000000-0000-0000-0000-000000000000"
      const result = await executeRPC("get_user_profile", { user_id: testUserId })

      return {
        id: "rpc",
        name: "Funções RPC",
        status: result.success ? "success" : "error",
        message: result.success ? "Funções RPC funcionando" : `Erro: ${result.error}`,
        details: result,
        lastTested: new Date(),
        recommendations: !result.success
          ? [
              "Verificar se funções RPC existem",
              "Confirmar permissões de execução",
              "Executar scripts de criação de funções",
            ]
          : [],
      }
    } catch (error) {
      return {
        id: "rpc",
        name: "Funções RPC",
        status: "error",
        message: `Erro: ${error instanceof Error ? error.message : "Desconhecido"}`,
        lastTested: new Date(),
      }
    }
  }

  const calculateOverallHealth = (results: DiagnosticResult[]) => {
    const weights = {
      success: 100,
      warning: 60,
      error: 0,
      testing: 50,
    }

    const totalScore = results.reduce((sum, result) => sum + weights[result.status], 0)
    const maxScore = results.length * 100
    const health = Math.round((totalScore / maxScore) * 100)

    setOverallHealth(health)
  }

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "testing":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
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
      case "testing":
        return "bg-blue-100 text-blue-800"
    }
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-600"
    if (health >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const criticalIssues = results.filter((r) => r.status === "error")
  const warnings = results.filter((r) => r.status === "warning")

  useEffect(() => {
    runDiagnostic()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diagnóstico do Sistema</h2>
          <p className="text-gray-600">Análise detalhada da saúde da plataforma</p>
        </div>
        <Button onClick={runDiagnostic} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Executando..." : "Executar Diagnóstico"}
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saúde Geral</p>
                <p className={`text-3xl font-bold ${getHealthColor(overallHealth)}`}>{overallHealth}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={overallHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Testes OK</p>
                <p className="text-3xl font-bold text-green-600">
                  {results.filter((r) => r.status === "success").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avisos</p>
                <p className="text-3xl font-bold text-yellow-600">{warnings.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Erros</p>
                <p className="text-3xl font-bold text-red-600">{criticalIssues.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {authError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro de Autenticação:</strong> {authError}
            <Button variant="outline" size="sm" onClick={retryConnection} className="ml-2 bg-transparent">
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {criticalIssues.length > 0 && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problemas Críticos:</strong> {criticalIssues.length} erros encontrados que precisam de atenção
            imediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{result.name}</h3>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status === "success" && "OK"}
                        {result.status === "warning" && "Aviso"}
                        {result.status === "error" && "Erro"}
                        {result.status === "testing" && "Testando"}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>

                    {result.responseTime && (
                      <p className="text-xs text-gray-500 mb-2">Tempo de resposta: {result.responseTime}ms</p>
                    )}

                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-blue-600 mb-1">Recomendações:</p>
                        <ul className="text-sm text-blue-600 list-disc list-inside">
                          {result.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">{result.lastTested.toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações Recomendadas */}
      {(criticalIssues.length > 0 || warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Ações Recomendadas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalIssues.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">🚨 Crítico - Resolver Imediatamente:</h4>
                  <ul className="space-y-1 text-sm">
                    {criticalIssues.map((issue, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>
                          {issue.name}: {issue.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-600 mb-2">⚠️ Avisos - Atenção Necessária:</h4>
                  <ul className="space-y-1 text-sm">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>
                          {warning.name}: {warning.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Último diagnóstico: {new Date().toLocaleString()}</span>
              <span>Total de testes: {results.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Sistema BISKATE v1.0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
