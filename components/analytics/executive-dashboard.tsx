"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Euro,
  Star,
  AlertTriangle,
  Lightbulb,
  Eye,
  X,
  Download,
} from "lucide-react"
import { AnalyticsService, type DailyMetrics, type AnalyticsInsight } from "@/lib/analytics/analytics-service"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface KPICardProps {
  title: string
  value: number | string
  change: number
  icon: React.ReactNode
  format?: "number" | "currency" | "percentage"
}

function KPICard({ title, value, change, icon, format = "number" }: KPICardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val

    switch (format) {
      case "currency":
        return `€${val.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`
      case "percentage":
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString("pt-PT")
    }
  }

  const isPositive = change >= 0
  const changeColor = isPositive ? "text-green-600" : "text-red-600"
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
            <div className={`flex items-center mt-1 ${changeColor}`}>
              <ChangeIcon className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}% vs ontem</span>
            </div>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface InsightCardProps {
  insight: AnalyticsInsight
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}

function InsightCard({ insight, onMarkAsRead, onDismiss }: InsightCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "warning":
        return "border-yellow-500 bg-yellow-50"
      default:
        return "border-blue-500 bg-blue-50"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <Lightbulb className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <Alert className={`${getSeverityColor(insight.severity)} ${!insight.is_read ? "border-l-4" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getSeverityIcon(insight.severity)}
          <div className="flex-1">
            <AlertTitle className="text-sm font-semibold">
              {insight.title}
              {!insight.is_read && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Novo
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm">{insight.description}</AlertDescription>

            {insight.suggested_actions && insight.suggested_actions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Ações Sugeridas:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {insight.suggested_actions.map((action, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!insight.is_read && (
            <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(insight.id)} className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onDismiss(insight.id)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}

export function ExecutiveDashboard() {
  const [kpis, setKpis] = useState<any>({})
  const [metrics, setMetrics] = useState<DailyMetrics[]>([])
  const [insights, setInsights] = useState<AnalyticsInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const [kpisData, metricsData, insightsData] = await Promise.all([
        AnalyticsService.getKPIs(),
        AnalyticsService.getDailyMetrics(30),
        AnalyticsService.getInsights(10),
      ])

      setKpis(kpisData)
      setMetrics(metricsData.reverse()) // Mais antigo primeiro para gráficos
      setInsights(insightsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (insightId: string) => {
    await AnalyticsService.markInsightAsRead(insightId)
    setInsights((prev) => prev.map((insight) => (insight.id === insightId ? { ...insight, is_read: true } : insight)))
  }

  const handleDismiss = async (insightId: string) => {
    await AnalyticsService.dismissInsight(insightId)
    setInsights((prev) => prev.filter((insight) => insight.id !== insightId))
  }

  const exportData = () => {
    // Implementar exportação
    console.log("Exporting data...")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
          <p className="text-gray-600">Visão geral dos KPIs e métricas da plataforma</p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total de Usuários"
          value={kpis.totalUsers?.value || 0}
          change={kpis.totalUsers?.change || 0}
          icon={<Users className="h-6 w-6 text-blue-600" />}
        />
        <KPICard
          title="Novos Usuários"
          value={kpis.newUsers?.value || 0}
          change={kpis.newUsers?.change || 0}
          icon={<Users className="h-6 w-6 text-green-600" />}
        />
        <KPICard
          title="Total de Gigs"
          value={kpis.totalGigs?.value || 0}
          change={kpis.totalGigs?.change || 0}
          icon={<Briefcase className="h-6 w-6 text-purple-600" />}
        />
        <KPICard
          title="Receita Total"
          value={kpis.totalRevenue?.value || 0}
          change={kpis.totalRevenue?.change || 0}
          icon={<Euro className="h-6 w-6 text-orange-600" />}
          format="currency"
        />
        <KPICard
          title="Avaliação Média"
          value={kpis.avgRating?.value || 0}
          change={kpis.avgRating?.change || 0}
          icon={<Star className="h-6 w-6 text-yellow-600" />}
          format="percentage"
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              Insights Automáticos
            </CardTitle>
            <CardDescription>Alertas e oportunidades detectadas automaticamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="gigs">Gigs</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  total_users: {
                    label: "Total de Usuários",
                    color: "hsl(var(--chart-1))",
                  },
                  new_users: {
                    label: "Novos Usuários",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="total_users" stroke="var(--color-total_users)" strokeWidth={2} />
                    <Line type="monotone" dataKey="new_users" stroke="var(--color-new_users)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gigs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade de Gigs</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  new_gigs: {
                    label: "Novos Gigs",
                    color: "hsl(var(--chart-3))",
                  },
                  approved_gigs: {
                    label: "Gigs Aprovados",
                    color: "hsl(var(--chart-4))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="new_gigs" fill="var(--color-new_gigs)" />
                    <Bar dataKey="approved_gigs" fill="var(--color-approved_gigs)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  total_revenue: {
                    label: "Receita Total",
                    color: "hsl(var(--chart-5))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="total_revenue"
                      stroke="var(--color-total_revenue)"
                      fill="var(--color-total_revenue)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
