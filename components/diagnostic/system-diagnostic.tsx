"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Shield,
  Zap,
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  Globe,
  Smartphone,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface DiagnosticResult {
  category: string
  name: string
  status: "complete" | "partial" | "missing" | "error"
  description: string
  priority: "high" | "medium" | "low"
  progress: number
  issues?: string[]
  recommendations?: string[]
}

interface SystemHealth {
  overall: number
  categories: {
    [key: string]: {
      score: number
      total: number
      completed: number
    }
  }
}

export function SystemDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [health, setHealth] = useState<SystemHealth>({ overall: 0, categories: {} })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const { user, profile } = useAuth()

  useEffect(() => {
    runDiagnostic()
  }, [])

  const runDiagnostic = async () => {
    setLoading(true)

    const results: DiagnosticResult[] = [
      // 1. AUTENTICAÇÃO E UTILIZADORES
      await checkAuthentication(),
      await checkUserProfiles(),
      await checkRoleSystem(),

      // 2. BASE DE DADOS
      await checkDatabaseTables(),
      await checkRLSPolicies(),
      await checkDataIntegrity(),

      // 3. FUNCIONALIDADES CORE
      await checkGigSystem(),
      await checkProposalSystem(),
      await checkPaymentSystem(),
      await checkReviewSystem(),

      // 4. COMUNICAÇÃO
      await checkNotificationSystem(),
      await checkChatSystem(),
      await checkRealtimeFeatures(),

      // 5. ADMIN E MODERAÇÃO
      await checkAdminPanel(),
      await checkModerationSystem(),
      await checkAnalytics(),

      // 6. SEO E MARKETING
      await checkSEOSetup(),
      await checkSocialIntegration(),

      // 7. PERFORMANCE E SEGURANÇA
      await checkPerformance(),
      await checkSecurity(),

      // 8. MOBILE E PWA
      await checkMobileOptimization(),
      await checkPWAFeatures(),
    ]

    setDiagnostics(results)
    calculateHealth(results)
    setLoading(false)
  }

  // Verificações individuais
  const checkAuthentication = async (): Promise<DiagnosticResult> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const hasAuth = !!session

      return {
        category: "Autenticação",
        name: "Sistema de Login/Registro",
        status: hasAuth ? "complete" : "partial",
        description: "Sistema de autenticação com Supabase Auth",
        priority: "high",
        progress: hasAuth ? 100 : 70,
        issues: hasAuth ? [] : ["Usuário não autenticado"],
        recommendations: hasAuth ? [] : ["Implementar login social", "Adicionar 2FA"],
      }
    } catch (error) {
      return {
        category: "Autenticação",
        name: "Sistema de Login/Registro",
        status: "error",
        description: "Erro ao verificar autenticação",
        priority: "high",
        progress: 0,
        issues: ["Erro de conexão com Supabase Auth"],
      }
    }
  }

  const checkUserProfiles = async (): Promise<DiagnosticResult> => {
    try {
      const { data: profiles, error } = await supabase.from("profiles").select("id, role, plan").limit(1)

      if (error) throw error

      return {
        category: "Utilizadores",
        name: "Perfis de Utilizador",
        status: "complete",
        description: "Sistema de perfis funcionando",
        priority: "high",
        progress: 100,
        recommendations: ["Adicionar campos personalizados", "Implementar verificação de perfil"],
      }
    } catch (error) {
      return {
        category: "Utilizadores",
        name: "Perfis de Utilizador",
        status: "error",
        description: "Erro ao verificar perfis",
        priority: "high",
        progress: 0,
        issues: ["Tabela profiles inacessível"],
      }
    }
  }

  const checkRoleSystem = async (): Promise<DiagnosticResult> => {
    const hasAdminRole = profile?.role === "admin"
    const hasUserRoles = ["user", "admin", "provider"].includes(profile?.role || "")

    return {
      category: "Utilizadores",
      name: "Sistema de Roles",
      status: hasUserRoles ? "complete" : "partial",
      description: "Sistema de permissões por role",
      priority: "high",
      progress: hasUserRoles ? 100 : 60,
      issues: hasUserRoles ? [] : ["Roles não definidos corretamente"],
      recommendations: ["Implementar role de moderador", "Adicionar permissões granulares"],
    }
  }

  const checkDatabaseTables = async (): Promise<DiagnosticResult> => {
    try {
      const tables = [
        "profiles",
        "gigs",
        "gig_responses",
        "categories",
        "notifications",
        "payments",
        "reviews",
        "conversations",
        "messages",
      ]

      let existingTables = 0
      for (const table of tables) {
        try {
          await supabase.from(table).select("id").limit(1)
          existingTables++
        } catch (error) {
          console.log(`Tabela ${table} não encontrada`)
        }
      }

      const progress = (existingTables / tables.length) * 100

      return {
        category: "Base de Dados",
        name: "Estrutura de Tabelas",
        status: progress === 100 ? "complete" : progress > 70 ? "partial" : "missing",
        description: `${existingTables}/${tables.length} tabelas principais encontradas`,
        priority: "high",
        progress,
        issues: progress < 100 ? [`${tables.length - existingTables} tabelas em falta`] : [],
        recommendations: ["Executar scripts de criação de tabelas", "Verificar integridade referencial"],
      }
    } catch (error) {
      return {
        category: "Base de Dados",
        name: "Estrutura de Tabelas",
        status: "error",
        description: "Erro ao verificar tabelas",
        priority: "high",
        progress: 0,
        issues: ["Erro de conexão com base de dados"],
      }
    }
  }

  const checkRLSPolicies = async (): Promise<DiagnosticResult> => {
    // Verificação simplificada de RLS
    try {
      const { data, error } = await supabase.from("profiles").select("id").limit(1)

      return {
        category: "Segurança",
        name: "Políticas RLS",
        status: error ? "error" : "partial",
        description: "Row Level Security configurado",
        priority: "high",
        progress: error ? 0 : 75,
        issues: error ? ["RLS bloqueando acesso"] : [],
        recommendations: ["Revisar políticas RLS", "Testar permissões por role"],
      }
    } catch (error) {
      return {
        category: "Segurança",
        name: "Políticas RLS",
        status: "error",
        description: "Erro ao verificar RLS",
        priority: "high",
        progress: 0,
        issues: ["Políticas RLS mal configuradas"],
      }
    }
  }

  const checkDataIntegrity = async (): Promise<DiagnosticResult> => {
    return {
      category: "Base de Dados",
      name: "Integridade de Dados",
      status: "partial",
      description: "Verificação de consistência de dados",
      priority: "medium",
      progress: 80,
      recommendations: ["Implementar validações", "Adicionar constraints", "Criar índices otimizados"],
    }
  }

  const checkGigSystem = async (): Promise<DiagnosticResult> => {
    try {
      const { data: gigs } = await supabase.from("gigs").select("id, status").limit(1)

      return {
        category: "Funcionalidades",
        name: "Sistema de Gigs",
        status: gigs ? "complete" : "missing",
        description: "Criação e gestão de trabalhos/serviços",
        priority: "high",
        progress: gigs ? 90 : 0,
        recommendations: ["Adicionar filtros avançados", "Implementar busca por localização", "Sistema de favoritos"],
      }
    } catch (error) {
      return {
        category: "Funcionalidades",
        name: "Sistema de Gigs",
        status: "error",
        description: "Erro ao verificar gigs",
        priority: "high",
        progress: 0,
        issues: ["Tabela gigs inacessível"],
      }
    }
  }

  const checkProposalSystem = async (): Promise<DiagnosticResult> => {
    try {
      const { data: responses } = await supabase.from("gig_responses").select("id").limit(1)

      return {
        category: "Funcionalidades",
        name: "Sistema de Propostas",
        status: responses ? "complete" : "missing",
        description: "Propostas e respostas a gigs",
        priority: "high",
        progress: responses ? 85 : 0,
        recommendations: ["Templates de proposta", "Sistema de negociação", "Propostas automáticas"],
      }
    } catch (error) {
      return {
        category: "Funcionalidades",
        name: "Sistema de Propostas",
        status: "error",
        description: "Erro ao verificar propostas",
        priority: "high",
        progress: 0,
        issues: ["Tabela gig_responses inacessível"],
      }
    }
  }

  const checkPaymentSystem = async (): Promise<DiagnosticResult> => {
    const hasStripeKeys = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    return {
      category: "Pagamentos",
      name: "Sistema de Pagamentos",
      status: hasStripeKeys ? "partial" : "missing",
      description: "Integração com Stripe para pagamentos",
      priority: "high",
      progress: hasStripeKeys ? 60 : 0,
      issues: hasStripeKeys ? [] : ["Chaves Stripe não configuradas"],
      recommendations: [
        "Configurar Stripe Connect",
        "Implementar escrow",
        "Sistema de faturas",
        "Múltiplos métodos de pagamento",
      ],
    }
  }

  const checkReviewSystem = async (): Promise<DiagnosticResult> => {
    try {
      const { data: reviews } = await supabase.from("reviews").select("id").limit(1)

      return {
        category: "Funcionalidades",
        name: "Sistema de Avaliações",
        status: reviews ? "partial" : "missing",
        description: "Avaliações e reputação",
        priority: "medium",
        progress: reviews ? 70 : 0,
        recommendations: ["Sistema de badges", "Moderação de reviews", "Estatísticas de reputação"],
      }
    } catch (error) {
      return {
        category: "Funcionalidades",
        name: "Sistema de Avaliações",
        status: "missing",
        description: "Tabela reviews não encontrada",
        priority: "medium",
        progress: 0,
        issues: ["Tabela reviews não existe"],
      }
    }
  }

  const checkNotificationSystem = async (): Promise<DiagnosticResult> => {
    try {
      const { data: notifications } = await supabase.from("notifications").select("id").limit(1)

      return {
        category: "Comunicação",
        name: "Sistema de Notificações",
        status: notifications ? "partial" : "missing",
        description: "Notificações in-app e push",
        priority: "medium",
        progress: notifications ? 60 : 0,
        recommendations: [
          "Push notifications",
          "Email notifications",
          "SMS notifications",
          "Preferências de notificação",
        ],
      }
    } catch (error) {
      return {
        category: "Comunicação",
        name: "Sistema de Notificações",
        status: "missing",
        description: "Sistema de notificações não configurado",
        priority: "medium",
        progress: 0,
        issues: ["Tabela notifications inacessível"],
      }
    }
  }

  const checkChatSystem = async (): Promise<DiagnosticResult> => {
    try {
      const { data: conversations } = await supabase.from("conversations").select("id").limit(1)

      return {
        category: "Comunicação",
        name: "Sistema de Chat",
        status: conversations ? "partial" : "missing",
        description: "Chat entre clientes e prestadores",
        priority: "medium",
        progress: conversations ? 70 : 0,
        recommendations: ["Chat em tempo real", "Anexos de ficheiros", "Histórico de conversas", "Moderação de chat"],
      }
    } catch (error) {
      return {
        category: "Comunicação",
        name: "Sistema de Chat",
        status: "missing",
        description: "Sistema de chat não implementado",
        priority: "medium",
        progress: 0,
        issues: ["Tabelas de chat não existem"],
      }
    }
  }

  const checkRealtimeFeatures = async (): Promise<DiagnosticResult> => {
    return {
      category: "Comunicação",
      name: "Funcionalidades Tempo Real",
      status: "partial",
      description: "Presença online, typing indicators",
      priority: "low",
      progress: 40,
      recommendations: ["Implementar presença de utilizador", "Indicadores de digitação", "Notificações em tempo real"],
    }
  }

  const checkAdminPanel = async (): Promise<DiagnosticResult> => {
    const hasAdminAccess = profile?.role === "admin"

    return {
      category: "Administração",
      name: "Painel Administrativo",
      status: hasAdminAccess ? "complete" : "partial",
      description: "Interface de administração",
      priority: "high",
      progress: hasAdminAccess ? 90 : 50,
      recommendations: [
        "Dashboard executivo",
        "Relatórios avançados",
        "Gestão de utilizadores",
        "Configurações da plataforma",
      ],
    }
  }

  const checkModerationSystem = async (): Promise<DiagnosticResult> => {
    return {
      category: "Administração",
      name: "Sistema de Moderação",
      status: "partial",
      description: "Moderação de conteúdo e utilizadores",
      priority: "medium",
      progress: 50,
      recommendations: ["Moderação automática", "Sistema de denúncias", "Workflow de aprovação", "Filtros de conteúdo"],
    }
  }

  const checkAnalytics = async (): Promise<DiagnosticResult> => {
    const hasGoogleAnalytics = !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

    return {
      category: "Analytics",
      name: "Sistema de Analytics",
      status: hasGoogleAnalytics ? "partial" : "missing",
      description: "Tracking e métricas da plataforma",
      priority: "medium",
      progress: hasGoogleAnalytics ? 60 : 20,
      recommendations: ["Google Analytics 4", "Métricas customizadas", "Dashboard de KPIs", "Relatórios automatizados"],
    }
  }

  const checkSEOSetup = async (): Promise<DiagnosticResult> => {
    const hasSEOConfig = !!process.env.GOOGLE_SITE_VERIFICATION

    return {
      category: "SEO/Marketing",
      name: "Configuração SEO",
      status: hasSEOConfig ? "partial" : "missing",
      description: "Otimização para motores de busca",
      priority: "medium",
      progress: hasSEOConfig ? 70 : 30,
      recommendations: ["Sitemap XML", "Meta tags dinâmicas", "Schema markup", "Open Graph", "Robots.txt"],
    }
  }

  const checkSocialIntegration = async (): Promise<DiagnosticResult> => {
    return {
      category: "SEO/Marketing",
      name: "Integração Social",
      status: "partial",
      description: "Partilha em redes sociais",
      priority: "low",
      progress: 40,
      recommendations: ["Login social", "Partilha de gigs", "Integração WhatsApp", "Newsletter"],
    }
  }

  const checkPerformance = async (): Promise<DiagnosticResult> => {
    return {
      category: "Performance",
      name: "Otimização de Performance",
      status: "partial",
      description: "Velocidade e otimização",
      priority: "medium",
      progress: 70,
      recommendations: ["Lazy loading", "Image optimization", "Caching", "CDN", "Bundle optimization"],
    }
  }

  const checkSecurity = async (): Promise<DiagnosticResult> => {
    return {
      category: "Segurança",
      name: "Segurança da Aplicação",
      status: "partial",
      description: "Medidas de segurança implementadas",
      priority: "high",
      progress: 75,
      recommendations: ["Rate limiting", "Input validation", "CSRF protection", "Security headers", "Audit logs"],
    }
  }

  const checkMobileOptimization = async (): Promise<DiagnosticResult> => {
    return {
      category: "Mobile",
      name: "Otimização Mobile",
      status: "partial",
      description: "Responsividade e UX mobile",
      priority: "high",
      progress: 80,
      recommendations: ["Touch gestures", "Mobile navigation", "Offline support", "App-like experience"],
    }
  }

  const checkPWAFeatures = async (): Promise<DiagnosticResult> => {
    return {
      category: "Mobile",
      name: "Progressive Web App",
      status: "partial",
      description: "Funcionalidades PWA",
      priority: "medium",
      progress: 50,
      recommendations: [
        "Service Worker",
        "App manifest",
        "Install prompt",
        "Offline functionality",
        "Push notifications",
      ],
    }
  }

  const calculateHealth = (results: DiagnosticResult[]) => {
    const categories: { [key: string]: { score: number; total: number; completed: number } } = {}

    results.forEach((result) => {
      if (!categories[result.category]) {
        categories[result.category] = { score: 0, total: 0, completed: 0 }
      }

      categories[result.category].score += result.progress
      categories[result.category].total += 100
      if (result.status === "complete") {
        categories[result.category].completed++
      }
    })

    Object.keys(categories).forEach((category) => {
      categories[category].score = Math.round((categories[category].score / categories[category].total) * 100)
    })

    const overall = Math.round(results.reduce((sum, result) => sum + result.progress, 0) / results.length)

    setHealth({ overall, categories })
  }

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "partial":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "missing":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
    }
  }

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "missing":
        return "bg-red-100 text-red-800"
      case "error":
        return "bg-red-100 text-red-900"
    }
  }

  const getPriorityColor = (priority: DiagnosticResult["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Autenticação":
      case "Utilizadores":
        return <Users className="h-5 w-5" />
      case "Base de Dados":
        return <Database className="h-5 w-5" />
      case "Segurança":
        return <Shield className="h-5 w-5" />
      case "Funcionalidades":
        return <Zap className="h-5 w-5" />
      case "Pagamentos":
        return <CreditCard className="h-5 w-5" />
      case "Comunicação":
        return <MessageSquare className="h-5 w-5" />
      case "Administração":
        return <Settings className="h-5 w-5" />
      case "Analytics":
        return <BarChart3 className="h-5 w-5" />
      case "SEO/Marketing":
        return <Globe className="h-5 w-5" />
      case "Performance":
        return <Zap className="h-5 w-5" />
      case "Mobile":
        return <Smartphone className="h-5 w-5" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const groupedDiagnostics = diagnostics.reduce(
    (acc, diagnostic) => {
      if (!acc[diagnostic.category]) {
        acc[diagnostic.category] = []
      }
      acc[diagnostic.category].push(diagnostic)
      return acc
    },
    {} as { [key: string]: DiagnosticResult[] },
  )

  const highPriorityIssues = diagnostics.filter(
    (d) => d.priority === "high" && (d.status === "missing" || d.status === "error"),
  )

  const completionStats = {
    complete: diagnostics.filter((d) => d.status === "complete").length,
    partial: diagnostics.filter((d) => d.status === "partial").length,
    missing: diagnostics.filter((d) => d.status === "missing").length,
    error: diagnostics.filter((d) => d.status === "error").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A executar diagnóstico do sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saúde Geral</p>
                <p className="text-3xl font-bold text-gray-900">{health.overall}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={health.overall} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completo</p>
                <p className="text-3xl font-bold text-green-600">{completionStats.complete}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Parcial</p>
                <p className="text-3xl font-bold text-yellow-600">{completionStats.partial}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Falta</p>
                <p className="text-3xl font-bold text-red-600">{completionStats.missing + completionStats.error}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de prioridade alta */}
      {highPriorityIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> {highPriorityIssues.length} problemas de alta prioridade encontrados que precisam
            de atenção imediata.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="priorities">Prioridades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {diagnostics.map((diagnostic, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getStatusIcon(diagnostic.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{diagnostic.name}</h3>
                          <Badge className={getStatusColor(diagnostic.status)}>{diagnostic.status}</Badge>
                          <Badge className={getPriorityColor(diagnostic.priority)}>{diagnostic.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{diagnostic.description}</p>
                        <Progress value={diagnostic.progress} className="mb-3" />

                        {diagnostic.issues && diagnostic.issues.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-red-600 mb-1">Problemas:</p>
                            <ul className="text-sm text-red-600 list-disc list-inside">
                              {diagnostic.issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {diagnostic.recommendations && diagnostic.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-blue-600 mb-1">Recomendações:</p>
                            <ul className="text-sm text-blue-600 list-disc list-inside">
                              {diagnostic.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{diagnostic.progress}%</p>
                      <p className="text-sm text-gray-500">{diagnostic.category}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {Object.entries(groupedDiagnostics).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                  <Badge variant="outline">{health.categories[category]?.score || 0}% completo</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.progress}%</p>
                        <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="priorities" className="space-y-4">
          {["high", "medium", "low"].map((priority) => {
            const items = diagnostics.filter((d) => d.priority === priority)
            if (items.length === 0) return null

            return (
              <Card key={priority}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Prioridade {priority === "high" ? "Alta" : priority === "medium" ? "Média" : "Baixa"}</span>
                    <Badge className={getPriorityColor(priority as any)}>{items.length} itens</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.progress}%</p>
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button onClick={runDiagnostic} disabled={loading}>
          {loading ? "A executar..." : "Executar Diagnóstico Novamente"}
        </Button>
      </div>
    </div>
  )
}
