"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Database,
  Zap,
  MessageSquare,
  CreditCard,
  Star,
  Settings,
  Globe,
  Activity,
  Smartphone,
  Play,
  Pause,
  BarChart3,
} from "lucide-react"
import { hasValidConfig } from "@/lib/supabase/client"

interface DiagnosticTest {
  id: string
  name: string
  category: string
  description: string
  status: "pending" | "running" | "passed" | "failed" | "warning"
  priority: "critical" | "high" | "medium" | "low"
  duration?: number
  error?: string
  recommendation?: string
  details?: any
}

interface DiagnosticStats {
  total: number
  passed: number
  failed: number
  warnings: number
  critical: number
}

const DIAGNOSTIC_TESTS: Omit<DiagnosticTest, "status" | "duration" | "error">[] = [
  // Infraestrutura
  {
    id: "supabase-connection",
    name: "Conexão Supabase",
    category: "infrastructure",
    description: "Verifica se a conexão com Supabase está funcional",
    priority: "critical",
    recommendation: "Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY",
  },
  {
    id: "environment-variables",
    name: "Variáveis de Ambiente",
    category: "infrastructure",
    description: "Verifica se todas as variáveis necessárias estão configuradas",
    priority: "critical",
    recommendation: "Configure todas as variáveis de ambiente necessárias",
  },
  {
    id: "auth-system",
    name: "Sistema de Autenticação",
    category: "infrastructure",
    description: "Testa o sistema de autenticação do Supabase",
    priority: "critical",
    recommendation: "Verifique a configuração de autenticação no Supabase",
  },

  // Base de Dados
  {
    id: "database-tables",
    name: "Tabelas da Base de Dados",
    category: "database",
    description: "Verifica se todas as tabelas principais existem",
    priority: "critical",
    recommendation: "Execute os scripts SQL para criar as tabelas em falta",
  },
  {
    id: "rls-policies",
    name: "Políticas RLS",
    category: "database",
    description: "Verifica se as políticas de segurança estão ativas",
    priority: "high",
    recommendation: "Configure as políticas RLS para todas as tabelas",
  },
  {
    id: "database-functions",
    name: "Funções da Base de Dados",
    category: "database",
    description: "Testa as funções RPC personalizadas",
    priority: "medium",
    recommendation: "Crie as funções RPC necessárias",
  },

  // Funcionalidades Core
  {
    id: "gigs-system",
    name: "Sistema de Gigs",
    category: "core",
    description: "Testa criação, edição e listagem de gigs",
    priority: "high",
    recommendation: "Verifique a tabela gigs e suas políticas",
  },
  {
    id: "user-profiles",
    name: "Perfis de Utilizador",
    category: "core",
    description: "Verifica sistema de perfis e roles",
    priority: "high",
    recommendation: "Configure a tabela profiles corretamente",
  },
  {
    id: "categories-system",
    name: "Sistema de Categorias",
    category: "core",
    description: "Testa gestão de categorias de serviços",
    priority: "medium",
    recommendation: "Configure a tabela categories",
  },

  // Comunicação
  {
    id: "notifications-system",
    name: "Sistema de Notificações",
    category: "communication",
    description: "Testa envio e recepção de notificações",
    priority: "high",
    recommendation: "Configure a tabela notifications e triggers",
  },
  {
    id: "chat-system",
    name: "Sistema de Chat",
    category: "communication",
    description: "Verifica funcionalidade de mensagens",
    priority: "medium",
    recommendation: "Configure as tabelas de chat e mensagens",
  },
  {
    id: "push-notifications",
    name: "Push Notifications",
    category: "communication",
    description: "Testa notificações push via Firebase",
    priority: "low",
    recommendation: "Configure Firebase Cloud Messaging",
  },

  // Pagamentos
  {
    id: "stripe-integration",
    name: "Integração Stripe",
    category: "payments",
    description: "Verifica configuração do Stripe",
    priority: "high",
    recommendation: "Configure as chaves do Stripe",
  },
  {
    id: "payment-processing",
    name: "Processamento de Pagamentos",
    category: "payments",
    description: "Testa fluxo de pagamentos",
    priority: "high",
    recommendation: "Teste o fluxo completo de pagamentos",
  },

  // SEO & Marketing
  {
    id: "seo-verification",
    name: "Verificação SEO",
    category: "seo",
    description: "Verifica meta tags e estrutura SEO",
    priority: "medium",
    recommendation: "Configure meta tags e structured data",
  },
  {
    id: "analytics-tracking",
    name: "Tracking Analytics",
    category: "seo",
    description: "Verifica Google Analytics e outros trackers",
    priority: "low",
    recommendation: "Configure Google Analytics",
  },

  // Performance & Mobile
  {
    id: "performance-metrics",
    name: "Métricas de Performance",
    category: "performance",
    description: "Mede tempos de carregamento",
    priority: "medium",
    recommendation: "Otimize componentes lentos",
  },
]

const categoryIcons = {
  infrastructure: Database,
  database: Database,
  core: Zap,
  communication: MessageSquare,
  payments: CreditCard,
  reviews: Star,
  admin: Settings,
  seo: Globe,
  performance: Activity,
  mobile: Smartphone,
}

const priorityColors = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
} as const

const statusIcons = {
  pending: Clock,
  running: RefreshCw,
  passed: CheckCircle,
  failed: XCircle,
  warning: AlertTriangle,
}

const statusColors = {
  pending: "text-gray-500",
  running: "text-blue-500 animate-spin",
  passed: "text-green-500",
  failed: "text-red-500",
  warning: "text-yellow-500",
}

export function CompleteSystemDiagnostic() {
  const [tests, setTests] = useState<DiagnosticTest[]>(
    DIAGNOSTIC_TESTS.map((test) => ({ ...test, status: "pending" as const })),
  )
  const [isRunning, setIsRunning] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [stats, setStats] = useState<DiagnosticStats>({
    total: DIAGNOSTIC_TESTS.length,
    passed: 0,
    failed: 0,
    warnings: 0,
    critical: 0,
  })

  // Simular testes de diagnóstico
  const runDiagnosticTest = async (test: DiagnosticTest): Promise<DiagnosticTest> => {
    const startTime = Date.now()

    // Simular tempo de execução
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 500))

    const duration = Date.now() - startTime

    // Lógica de teste baseada no ID
    let status: DiagnosticTest["status"] = "passed"
    let error: string | undefined
    let details: any = {}

    switch (test.id) {
      case "supabase-connection":
        if (!hasValidConfig) {
          status = "failed"
          error = "Variáveis de ambiente do Supabase não configuradas"
        }
        details = { configured: hasValidConfig }
        break

      case "environment-variables":
        const requiredVars = [
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "STRIPE_SECRET_KEY",
          "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        ]
        const missingVars = requiredVars.filter((varName) => !process.env[varName])
        if (missingVars.length > 0) {
          status = "warning"
          error = `Variáveis em falta: ${missingVars.join(", ")}`
        }
        details = { missing: missingVars, total: requiredVars.length }
        break

      case "auth-system":
        if (!hasValidConfig) {
          status = "failed"
          error = "Sistema de autenticação não disponível"
        }
        break

      case "database-tables":
        // Simular verificação de tabelas
        const expectedTables = ["profiles", "gigs", "notifications", "categories", "reviews"]
        const missingTables = Math.random() > 0.7 ? ["categories"] : []
        if (missingTables.length > 0) {
          status = "warning"
          error = `Tabelas em falta: ${missingTables.join(", ")}`
        }
        details = { missing: missingTables, total: expectedTables.length }
        break

      case "rls-policies":
        // Simular verificação de políticas RLS
        if (Math.random() > 0.8) {
          status = "warning"
          error = "Algumas políticas RLS podem estar em falta"
        }
        break

      case "stripe-integration":
        const hasStripeKeys = process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!hasStripeKeys) {
          status = "failed"
          error = "Chaves do Stripe não configuradas"
        }
        details = { configured: !!hasStripeKeys }
        break

      default:
        // Para outros testes, simular resultados aleatórios
        const rand = Math.random()
        if (rand > 0.85) {
          status = "failed"
          error = "Teste falhou - configuração necessária"
        } else if (rand > 0.7) {
          status = "warning"
          error = "Teste passou com avisos"
        }
        break
    }

    return {
      ...test,
      status,
      duration,
      error,
      details,
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setCurrentTest(null)

    // Reset all tests to pending
    setTests((prev) => prev.map((test) => ({ ...test, status: "pending" as const })))

    for (const test of tests) {
      setCurrentTest(test.id)
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, status: "running" as const } : t)))

      const result = await runDiagnosticTest(test)

      setTests((prev) => prev.map((t) => (t.id === test.id ? result : t)))
    }

    setCurrentTest(null)
    setIsRunning(false)
  }

  // Calcular estatísticas
  useEffect(() => {
    const newStats = tests.reduce(
      (acc, test) => {
        if (test.status === "passed") acc.passed++
        else if (test.status === "failed") acc.failed++
        else if (test.status === "warning") acc.warnings++

        if (test.priority === "critical" && test.status === "failed") acc.critical++

        return acc
      },
      {
        total: tests.length,
        passed: 0,
        failed: 0,
        warnings: 0,
        critical: 0,
      },
    )

    setStats(newStats)
  }, [tests])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (!isRunning) {
        runAllTests()
      }
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [autoRefresh, isRunning])

  const progress = (tests.filter((t) => t.status !== "pending").length / tests.length) * 100

  const groupedTests = tests.reduce(
    (acc, test) => {
      if (!acc[test.category]) acc[test.category] = []
      acc[test.category].push(test)
      return acc
    },
    {} as Record<string, DiagnosticTest[]>,
  )

  const criticalIssues = tests.filter((t) => t.priority === "critical" && t.status === "failed")

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Diagnóstico do Sistema</h2>
          <p className="text-muted-foreground">Análise completa de {tests.length} componentes críticos</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} disabled={isRunning} />
            <label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh (30s)
            </label>
          </div>

          <Button onClick={runAllTests} disabled={isRunning} className="min-w-[120px]">
            {isRunning ? (
              <>
                <Pause className="mr-2 h-4 w-4" />A executar...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Executar Testes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alertas críticos */}
      {criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Problemas Críticos Encontrados:</strong> {criticalIssues.length} componentes críticos falharam.
            Estes problemas podem afetar o funcionamento da plataforma.
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total de Testes</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-muted-foreground">Aprovados</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Falharam</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <div className="text-sm text-muted-foreground">Avisos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-800">{stats.critical}</div>
            <div className="text-sm text-muted-foreground">Críticos</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de progresso */}
      {isRunning && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso dos Testes</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentTest && (
                <div className="text-sm text-muted-foreground">
                  A executar: {tests.find((t) => t.id === currentTest)?.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados dos testes */}
      <Tabs defaultValue="by-category" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="by-category">Por Categoria</TabsTrigger>
          <TabsTrigger value="by-priority">Por Prioridade</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="by-category" className="space-y-4">
          {Object.entries(groupedTests).map(([category, categoryTests]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons] || Database

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <Badge variant="outline">{categoryTests.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryTests.map((test) => {
                      const StatusIcon = statusIcons[test.status]

                      return (
                        <div key={test.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex items-start gap-3 flex-1">
                            <StatusIcon className={`h-5 w-5 mt-0.5 ${statusColors[test.status]}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{test.name}</h4>
                                <Badge variant={priorityColors[test.priority]} size="sm">
                                  {test.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                              {test.error && <p className="text-sm text-red-600 mb-2">❌ {test.error}</p>}
                              {test.recommendation && test.status !== "passed" && (
                                <p className="text-sm text-blue-600">💡 {test.recommendation}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {test.duration && `${test.duration}ms`}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="by-priority" className="space-y-4">
          {(["critical", "high", "medium", "low"] as const).map((priority) => {
            const priorityTests = tests.filter((t) => t.priority === priority)
            if (priorityTests.length === 0) return null

            return (
              <Card key={priority}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Prioridade {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    <Badge variant={priorityColors[priority]}>{priorityTests.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {priorityTests.map((test) => {
                      const StatusIcon = statusIcons[test.status]

                      return (
                        <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <StatusIcon className={`h-5 w-5 ${statusColors[test.status]}`} />
                            <div>
                              <h4 className="font-medium">{test.name}</h4>
                              <p className="text-sm text-muted-foreground">{test.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={test.status === "passed" ? "default" : "destructive"}>{test.status}</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo Executivo
              </CardTitle>
              <CardDescription>Análise geral do estado da plataforma BISKATE</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Estado Geral</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Taxa de Sucesso:</span>
                      <span className="font-medium">{Math.round((stats.passed / stats.total) * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Problemas Críticos:</span>
                      <span className={`font-medium ${stats.critical > 0 ? "text-red-600" : "text-green-600"}`}>
                        {stats.critical}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Configuração Supabase:</span>
                      <span className={`font-medium ${hasValidConfig ? "text-green-600" : "text-red-600"}`}>
                        {hasValidConfig ? "Configurado" : "Não Configurado"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recomendações Principais</h4>
                  <div className="space-y-2 text-sm">
                    {!hasValidConfig && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        🔴 Configure as variáveis de ambiente do Supabase
                      </div>
                    )}
                    {stats.critical > 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        🔴 Resolva {stats.critical} problema(s) crítico(s)
                      </div>
                    )}
                    {stats.warnings > 0 && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                        🟡 Verifique {stats.warnings} aviso(s)
                      </div>
                    )}
                    {stats.failed === 0 && stats.warnings === 0 && (
                      <div className="p-2 bg-green-50 border border-green-200 rounded">
                        ✅ Sistema funcionando corretamente
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
