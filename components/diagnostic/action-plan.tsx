"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Database,
  CreditCard,
  MessageSquare,
  Bell,
  Zap,
  Globe,
  Shield,
  BarChart3,
  Star,
} from "lucide-react"

interface ActionItem {
  id: string
  title: string
  description: string
  category: "critical" | "important" | "enhancement"
  priority: 1 | 2 | 3 | 4 | 5
  estimatedHours: number
  dependencies?: string[]
  status: "pending" | "in_progress" | "completed"
  icon: React.ReactNode
  tasks: string[]
}

export function ActionPlan() {
  const actionItems: ActionItem[] = [
    {
      id: "fix-database-rls",
      title: "Corrigir Políticas RLS da Base de Dados",
      description: "Resolver problemas de acesso às tabelas devido a políticas RLS mal configuradas",
      category: "critical",
      priority: 1,
      estimatedHours: 4,
      status: "pending",
      icon: <Database className="h-5 w-5" />,
      tasks: [
        "Revisar políticas RLS de todas as tabelas",
        "Corrigir políticas que bloqueiam acesso legítimo",
        "Testar acesso com diferentes roles",
        "Documentar políticas implementadas",
      ],
    },
    {
      id: "setup-stripe-payments",
      title: "Configurar Sistema de Pagamentos Stripe",
      description: "Implementar integração completa com Stripe para pagamentos seguros",
      category: "critical",
      priority: 1,
      estimatedHours: 8,
      status: "pending",
      icon: <CreditCard className="h-5 w-5" />,
      tasks: [
        "Configurar chaves Stripe (test e live)",
        "Implementar Stripe Connect para prestadores",
        "Criar sistema de escrow",
        "Implementar webhooks para confirmação",
        "Testar fluxo completo de pagamento",
      ],
    },
    {
      id: "implement-realtime-chat",
      title: "Sistema de Chat em Tempo Real",
      description: "Implementar chat funcional entre clientes e prestadores",
      category: "important",
      priority: 2,
      estimatedHours: 12,
      status: "pending",
      icon: <MessageSquare className="h-5 w-5" />,
      tasks: [
        "Configurar Supabase Realtime",
        "Implementar interface de chat",
        "Adicionar indicadores de digitação",
        "Sistema de anexos de ficheiros",
        "Histórico de conversas",
        "Notificações de mensagens",
      ],
    },
    {
      id: "push-notifications",
      title: "Notificações Push",
      description: "Implementar sistema completo de notificações push",
      category: "important",
      priority: 2,
      estimatedHours: 6,
      status: "pending",
      icon: <Bell className="h-5 w-5" />,
      tasks: [
        "Configurar Firebase Cloud Messaging",
        "Implementar service worker",
        "Sistema de subscrição de notificações",
        "Templates de notificação",
        "Preferências de utilizador",
      ],
    },
    {
      id: "complete-review-system",
      title: "Sistema de Avaliações Completo",
      description: "Finalizar sistema de reviews e reputação",
      category: "important",
      priority: 3,
      estimatedHours: 8,
      status: "pending",
      icon: <Star className="h-5 w-5" />,
      tasks: [
        "Criar tabelas de reviews",
        "Interface para criar avaliações",
        "Sistema de badges e conquistas",
        "Cálculo de reputação",
        "Moderação de reviews",
        "Estatísticas de prestador",
      ],
    },
    {
      id: "performance-optimization",
      title: "Otimização de Performance",
      description: "Melhorar velocidade e experiência do utilizador",
      category: "enhancement",
      priority: 3,
      estimatedHours: 10,
      status: "pending",
      icon: <Zap className="h-5 w-5" />,
      tasks: [
        "Implementar lazy loading",
        "Otimizar imagens (Next.js Image)",
        "Configurar caching",
        "Minificar e comprimir assets",
        "Implementar service worker",
        "Otimizar queries da base de dados",
      ],
    },
    {
      id: "seo-setup",
      title: "Configuração SEO Completa",
      description: "Otimizar para motores de busca e redes sociais",
      category: "enhancement",
      priority: 4,
      estimatedHours: 6,
      status: "pending",
      icon: <Globe className="h-5 w-5" />,
      tasks: [
        "Configurar Google Analytics 4",
        "Implementar meta tags dinâmicas",
        "Criar sitemap XML",
        "Configurar Open Graph",
        "Schema markup para gigs",
        "Robots.txt otimizado",
      ],
    },
    {
      id: "security-hardening",
      title: "Endurecimento de Segurança",
      description: "Implementar medidas de segurança adicionais",
      category: "important",
      priority: 2,
      estimatedHours: 8,
      status: "pending",
      icon: <Shield className="h-5 w-5" />,
      tasks: [
        "Rate limiting para APIs",
        "Validação de input rigorosa",
        "Headers de segurança",
        "Audit logs",
        "Proteção CSRF",
        "Sanitização de dados",
      ],
    },
    {
      id: "analytics-dashboard",
      title: "Dashboard de Analytics Avançado",
      description: "Sistema completo de métricas e relatórios",
      category: "enhancement",
      priority: 4,
      estimatedHours: 12,
      status: "pending",
      icon: <BarChart3 className="h-5 w-5" />,
      tasks: [
        "Métricas de utilizador",
        "Analytics de gigs",
        "Relatórios financeiros",
        "KPIs da plataforma",
        "Dashboards executivos",
        "Exportação de dados",
      ],
    },
  ]

  const getCategoryColor = (category: ActionItem["category"]) => {
    switch (category) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "important":
        return "bg-yellow-100 text-yellow-800"
      case "enhancement":
        return "bg-blue-100 text-blue-800"
    }
  }

  const getCategoryIcon = (category: ActionItem["category"]) => {
    switch (category) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />
      case "important":
        return <Clock className="h-4 w-4" />
      case "enhancement":
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return "text-red-600"
    if (priority <= 3) return "text-yellow-600"
    return "text-green-600"
  }

  const totalHours = actionItems.reduce((sum, item) => sum + item.estimatedHours, 0)
  const criticalItems = actionItems.filter((item) => item.category === "critical")
  const completedItems = actionItems.filter((item) => item.status === "completed")

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
                <p className="text-3xl font-bold text-gray-900">{actionItems.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticas</p>
                <p className="text-3xl font-bold text-red-600">{criticalItems.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas Estimadas</p>
                <p className="text-3xl font-bold text-blue-600">{totalHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progresso</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round((completedItems.length / actionItems.length) * 100)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta para itens críticos */}
      {criticalItems.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Existem {criticalItems.length} tarefas críticas que devem ser resolvidas antes do
            lançamento.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de ações */}
      <div className="space-y-4">
        {actionItems
          .sort((a, b) => a.priority - b.priority)
          .map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">{item.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(item.category)}>
                      {getCategoryIcon(item.category)}
                      <span className="ml-1">
                        {item.category === "critical"
                          ? "Crítico"
                          : item.category === "important"
                            ? "Importante"
                            : "Melhoria"}
                      </span>
                    </Badge>
                    <Badge variant="outline">P{item.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Estimativa: {item.estimatedHours} horas</span>
                    <span className={`font-medium ${getPriorityColor(item.priority)}`}>Prioridade {item.priority}</span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Tarefas:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {item.tasks.map((task, index) => (
                        <li key={index}>{task}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
