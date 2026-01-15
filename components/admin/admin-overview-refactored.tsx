"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, AlertTriangle, MessageSquare, Activity, TrendingUp, RefreshCw } from "lucide-react"
import { useAdminStats } from "@/hooks/use-admin-stats"
import { AdminLoadingState } from "./shared/admin-loading-state"
import { AdminErrorBoundary } from "./shared/admin-error-boundary"

export function AdminOverviewRefactored() {
  const { stats, loading, refreshStats } = useAdminStats()

  if (loading) {
    return <AdminLoadingState message="Carregando estatísticas do painel..." />
  }

  const statCards = [
    {
      title: "Total de Utilizadores",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total de Biskates",
      value: stats.totalGigs,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Biskates Pendentes",
      value: stats.pendingGigs,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Alertas de Moderação",
      value: stats.pendingAlerts,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Total de Respostas",
      value: stats.totalResponses,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Utilizadores Ativos",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ]

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-gray-600">Visão geral da plataforma Biskate</p>
          </div>
          <Button onClick={refreshStats} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Dados em tempo real
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Users className="h-6 w-6 mb-2" />
                <span>Gerir Utilizadores</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <FileText className="h-6 w-6 mb-2" />
                <span>Aprovar Biskates</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <span>Ver Alertas</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Activity className="h-6 w-6 mb-2" />
                <span>Análises</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminErrorBoundary>
  )
}
