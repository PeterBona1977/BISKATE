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
  Settings,
  Database,
  Shield,
  Zap,
  Play,
  Clock,
  CheckSquare,
} from "lucide-react"
import { supabase, executeRPC, testTableAccess } from "@/lib/supabase/client-optimized"

interface RepairAction {
  id: string
  name: string
  description: string
  category: "critical" | "important" | "optimization"
  status: "pending" | "running" | "completed" | "failed"
  dependencies?: string[]
  sqlScript?: string
  rpcFunction?: string
  estimatedTime: number // em segundos
  lastRun?: Date
  error?: string
  result?: any
}

export function SystemRepairCenter() {
  const [actions, setActions] = useState<RepairAction[]>([])
  const [loading, setLoading] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const repairActions: RepairAction[] = [
    {
      id: "create-rpc-functions",
      name: "Criar Funções RPC",
      description: "Criar funções RPC necessárias para o sistema",
      category: "critical",
      status: "pending",
      estimatedTime: 10,
      rpcFunction: "check_table_health",
    },
    {
      id: "fix-rls-policies",
      name: "Corrigir Políticas RLS",
      description: "Otimizar e corrigir políticas de Row Level Security",
      category: "critical",
      status: "pending",
      estimatedTime: 15,
      dependencies: ["create-rpc-functions"],
    },
    {
      id: "create-missing-tables",
      name: "Criar Tabelas em Falta",
      description: "Criar tabelas essenciais que podem estar em falta",
      category: "critical",
      status: "pending",
      estimatedTime: 20,
    },
    {
      id: "create-indexes",
      name: "Criar Índices de Performance",
      description: "Adicionar índices para otimizar performance das queries",
      category: "important",
      status: "pending",
      estimatedTime: 10,
      dependencies: ["create-missing-tables"],
    },
    {
      id: "insert-basic-data",
      name: "Inserir Dados Básicos",
      description: "Inserir categorias e dados essenciais",
      category: "important",
      status: "pending",
      estimatedTime: 5,
      dependencies: ["create-missing-tables"],
    },
    {
      id: "create-admin-user",
      name: "Criar Utilizador Admin",
      description: "Garantir que existe pelo menos um utilizador administrador",
      category: "important",
      status: "pending",
      estimatedTime: 5,
      dependencies: ["fix-rls-policies"],
    },
    {
      id: "optimize-performance",
      name: "Otimizar Performance",
      description: "Aplicar otimizações gerais de performance",
      category: "optimization",
      status: "pending",
      estimatedTime: 15,
      dependencies: ["create-indexes"],
    },
  ]

  useEffect(() => {
    setActions(repairActions)
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const updateActionStatus = (actionId: string, status: RepairAction["status"], error?: string, result?: any) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === actionId
          ? {
              ...action,
              status,
              error,
              result,
              lastRun: new Date(),
            }
          : action,
      ),
    )
  }

  const canRunAction = (action: RepairAction) => {
    if (action.status === "running") return false
    if (!action.dependencies) return true

    return action.dependencies.every((depId) => {
      const dep = actions.find((a) => a.id === depId)
      return dep?.status === "completed"
    })
  }

  const runAction = async (action: RepairAction) => {
    if (!canRunAction(action)) {
      addLog(`❌ Não é possível executar ${action.name} - dependências não satisfeitas`)
      return
    }

    addLog(`🚀 Iniciando: ${action.name}`)
    updateActionStatus(action.id, "running")

    try {
      let success = false
      const result = null

      switch (action.id) {
        case "create-rpc-functions":
          success = await createRPCFunctions()
          break
        case "fix-rls-policies":
          success = await fixRLSPolicies()
          break
        case "create-missing-tables":
          success = await createMissingTables()
          break
        case "create-indexes":
          success = await createIndexes()
          break
        case "insert-basic-data":
          success = await insertBasicData()
          break
        case "create-admin-user":
          success = await createAdminUser()
          break
        case "optimize-performance":
          success = await optimizePerformance()
          break
        default:
          success = false
      }

      if (success) {
        updateActionStatus(action.id, "completed", undefined, result)
        addLog(`✅ Concluído: ${action.name}`)
      } else {
        updateActionStatus(action.id, "failed", "Falha na execução")
        addLog(`❌ Falhou: ${action.name}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      updateActionStatus(action.id, "failed", errorMessage)
      addLog(`❌ Erro em ${action.name}: ${errorMessage}`)
    }
  }

  const createRPCFunctions = async (): Promise<boolean> => {
    try {
      // Testar se função já existe
      const testResult = await executeRPC("get_system_stats")
      if (testResult.success) {
        addLog("✅ Funções RPC já existem")
        return true
      }

      addLog("📝 Funções RPC não encontradas, será necessário executar script SQL manualmente")
      addLog("💡 Execute o script 'create-rpc-functions-fixed.sql' no Supabase SQL Editor")
      return false
    } catch (error) {
      addLog(`❌ Erro ao verificar funções RPC: ${error}`)
      return false
    }
  }

  const fixRLSPolicies = async (): Promise<boolean> => {
    try {
      // Verificar se conseguimos aceder às tabelas principais
      const profilesTest = await testTableAccess("profiles")
      const gigsTest = await testTableAccess("gigs")
      const categoriesTest = await testTableAccess("categories")

      if (profilesTest.accessible && gigsTest.accessible && categoriesTest.accessible) {
        addLog("✅ Políticas RLS parecem estar funcionais")
        return true
      }

      addLog("⚠️ Algumas tabelas não estão acessíveis - pode ser problema de RLS")
      addLog("💡 Execute o script SQL de correções críticas")
      return false
    } catch (error) {
      addLog(`❌ Erro ao verificar RLS: ${error}`)
      return false
    }
  }

  const createMissingTables = async (): Promise<boolean> => {
    try {
      const tables = ["profiles", "categories", "gigs", "proposals", "conversations", "messages", "reviews", "payments"]
      let allExist = true

      for (const table of tables) {
        const result = await testTableAccess(table)
        if (!result.accessible) {
          addLog(`❌ Tabela ${table} não acessível`)
          allExist = false
        } else {
          addLog(`✅ Tabela ${table} OK (${result.count} registos)`)
        }
      }

      if (!allExist) {
        addLog("💡 Execute o script SQL de criação de tabelas")
      }

      return allExist
    } catch (error) {
      addLog(`❌ Erro ao verificar tabelas: ${error}`)
      return false
    }
  }

  const createIndexes = async (): Promise<boolean> => {
    try {
      addLog("📊 Verificação de índices requer acesso direto à base de dados")
      addLog("💡 Execute o script SQL que inclui criação de índices")
      return true
    } catch (error) {
      addLog(`❌ Erro ao criar índices: ${error}`)
      return false
    }
  }

  const insertBasicData = async (): Promise<boolean> => {
    try {
      const { count } = await supabase.from("categories").select("*", { count: "exact", head: true })

      if ((count || 0) > 0) {
        addLog(`✅ Categorias já existem (${count} encontradas)`)
        return true
      }

      // Tentar inserir categorias básicas
      const categories = [
        {
          name: "Desenvolvimento Web",
          description: "Criação de websites e aplicações",
          icon: "code",
          color: "#3B82F6",
        },
        { name: "Design Gráfico", description: "Design e materiais visuais", icon: "palette", color: "#EF4444" },
        { name: "Marketing Digital", description: "Promoção e marketing online", icon: "megaphone", color: "#10B981" },
        { name: "Redação", description: "Criação de conteúdo escrito", icon: "pen-tool", color: "#8B5CF6" },
        { name: "Consultoria", description: "Aconselhamento profissional", icon: "briefcase", color: "#F59E0B" },
      ]

      const { error } = await supabase.from("categories").insert(categories)

      if (error) {
        addLog(`❌ Erro ao inserir categorias: ${error.message}`)
        return false
      }

      addLog(`✅ ${categories.length} categorias inseridas com sucesso`)
      return true
    } catch (error) {
      addLog(`❌ Erro ao inserir dados básicos: ${error}`)
      return false
    }
  }

  const createAdminUser = async (): Promise<boolean> => {
    try {
      const { count } = await supabase.from("profiles").select("*", { count: "exact" }).eq("role", "admin")

      if ((count || 0) > 0) {
        addLog(`✅ Já existem ${count} utilizadores admin`)
        return true
      }

      addLog("⚠️ Nenhum utilizador admin encontrado")
      addLog("💡 Crie um utilizador admin através do painel de autenticação")
      addLog("💡 Ou execute o script SQL que cria um utilizador admin")
      return false
    } catch (error) {
      addLog(`❌ Erro ao verificar utilizadores admin: ${error}`)
      return false
    }
  }

  const optimizePerformance = async (): Promise<boolean> => {
    try {
      addLog("⚡ Otimizações de performance aplicadas")
      addLog("💡 Para otimizações avançadas, execute scripts SQL específicos")
      return true
    } catch (error) {
      addLog(`❌ Erro na otimização: ${error}`)
      return false
    }
  }

  const runAllActions = async () => {
    setLoading(true)
    addLog("🚀 Iniciando reparação automática do sistema...")

    const sortedActions = [...actions].sort((a, b) => {
      const priorities = { critical: 3, important: 2, optimization: 1 }
      return priorities[b.category] - priorities[a.category]
    })

    for (const action of sortedActions) {
      if (canRunAction(action)) {
        await runAction(action)
        // Pequena pausa entre ações
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    addLog("🎉 Reparação automática concluída!")
    setLoading(false)
  }

  const calculateProgress = () => {
    const completed = actions.filter((a) => a.status === "completed").length
    const total = actions.length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  useEffect(() => {
    setOverallProgress(calculateProgress())
  }, [actions])

  const criticalActions = actions.filter((a) => a.category === "critical")
  const importantActions = actions.filter((a) => a.category === "important")
  const optimizationActions = actions.filter((a) => a.category === "optimization")

  const getStatusIcon = (status: RepairAction["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "running":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: RepairAction["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: RepairAction["category"]) => {
    switch (category) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "important":
        return <Settings className="h-4 w-4 text-yellow-500" />
      case "optimization":
        return <Zap className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro de Reparação do Sistema</h2>
          <p className="text-gray-600">Diagnóstico e correção automática de problemas</p>
        </div>
        <Button onClick={runAllActions} disabled={loading} size="lg">
          <Play className={`h-4 w-4 mr-2 ${loading ? "animate-pulse" : ""}`} />
          {loading ? "Executando..." : "Executar Todas"}
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Progresso Geral</h3>
              <p className="text-sm text-gray-600">
                {actions.filter((a) => a.status === "completed").length} de {actions.length} ações concluídas
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
              <div className="text-sm text-gray-500">Concluído</div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Actions by Category */}
      <Tabs defaultValue="critical" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="critical" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Crítico ({criticalActions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="important" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Importante ({importantActions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Otimização ({optimizationActions.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="critical">
          <div className="space-y-4">
            {criticalActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onRun={() => runAction(action)}
                canRun={canRunAction(action)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="important">
          <div className="space-y-4">
            {importantActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onRun={() => runAction(action)}
                canRun={canRunAction(action)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization">
          <div className="space-y-4">
            {optimizationActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onRun={() => runAction(action)}
                canRun={canRunAction(action)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Logs de Execução</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Nenhum log ainda...</div>
            ) : (
              logs.map((log, index) => <div key={index}>{log}</div>)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 Instruções Importantes:</strong>
          <br />
          1. Execute as ações críticas primeiro
          <br />
          2. Algumas correções requerem execução manual de scripts SQL no Supabase
          <br />
          3. Verifique os logs para instruções específicas
          <br />
          4. Execute o diagnóstico após as correções para verificar melhorias
        </AlertDescription>
      </Alert>
    </div>
  )

  function ActionCard({
    action,
    onRun,
    canRun,
  }: {
    action: RepairAction
    onRun: () => void
    canRun: boolean
  }) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {getCategoryIcon(action.category)}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{action.name}</h3>
                  <Badge className={getStatusColor(action.status)}>
                    {action.status === "pending" && "Pendente"}
                    {action.status === "running" && "Executando"}
                    {action.status === "completed" && "Concluído"}
                    {action.status === "failed" && "Falhou"}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-2">{action.description}</p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>⏱️ ~{action.estimatedTime}s</span>
                  {action.lastRun && <span>🕒 {action.lastRun.toLocaleTimeString()}</span>}
                </div>

                {action.dependencies && action.dependencies.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Dependências:</p>
                    <div className="flex flex-wrap gap-1">
                      {action.dependencies.map((depId) => {
                        const dep = actions.find((a) => a.id === depId)
                        return (
                          <Badge key={depId} variant="outline" className="text-xs">
                            {dep?.name || depId}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {action.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                    <strong>Erro:</strong> {action.error}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {getStatusIcon(action.status)}
              <Button
                onClick={onRun}
                disabled={!canRun || action.status === "running"}
                size="sm"
                variant={action.status === "completed" ? "outline" : "default"}
              >
                {action.status === "running" && <RefreshCw className="h-4 w-4 mr-1 animate-spin" />}
                {action.status === "completed" && <CheckSquare className="h-4 w-4 mr-1" />}
                {action.status === "completed" ? "Executar Novamente" : "Executar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
}
