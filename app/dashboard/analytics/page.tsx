"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatsCard } from "@/components/dashboard/stats-card"
import { useUser } from "@/hooks/use-user"
import { BarChart3, Eye, MessageSquare, Star, Calendar, Users, Target } from "lucide-react"

interface AnalyticsData {
  totalBiskates: number
  totalViews: number
  totalResponses: number
  averageRating: number
  responseRate: number
  topCategories: Array<{ category: string; count: number }>
  monthlyStats: Array<{ month: string; biskates: number; responses: number }>
  recentActivity: Array<{ type: string; description: string; date: string }>
}

export default function AnalyticsPage() {
  const { user } = useUser()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  const loadAnalytics = async () => {
    try {
      // Simular dados de analytics (em produção, estes viriam da base de dados)
      const mockData: AnalyticsData = {
        totalBiskates: 12,
        totalViews: 1247,
        totalResponses: 89,
        averageRating: 4.6,
        responseRate: 7.1,
        topCategories: [
          { category: "Design", count: 5 },
          { category: "Programação", count: 4 },
          { category: "Marketing", count: 2 },
          { category: "Consultoria", count: 1 },
        ],
        monthlyStats: [
          { month: "Jan", biskates: 2, responses: 15 },
          { month: "Fev", biskates: 3, responses: 22 },
          { month: "Mar", biskates: 4, responses: 31 },
          { month: "Abr", biskates: 3, responses: 21 },
        ],
        recentActivity: [
          { type: "response", description: 'Nova resposta ao seu biskate "Design de Logo"', date: "2024-01-15" },
          {
            type: "view",
            description: 'Seu biskate "Website Corporativo" foi visualizado 15 vezes',
            date: "2024-01-14",
          },
          { type: "rating", description: "Recebeu avaliação de 5 estrelas", date: "2024-01-13" },
        ],
      }

      setAnalytics(mockData)
    } catch (error) {
      console.error("Erro ao carregar analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho dos seus biskates</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho dos seus biskates</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Erro ao carregar dados de analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho dos seus biskates</p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Biskates"
          value={analytics.totalBiskates.toString()}
          description="Biskates publicados"
          icon={BarChart3}
        />
        <StatsCard
          title="Visualizações"
          value={analytics.totalViews.toString()}
          description="Visualizações totais"
          icon={Eye}
        />
        <StatsCard
          title="Respostas"
          value={analytics.totalResponses.toString()}
          description="Respostas recebidas"
          icon={MessageSquare}
        />
        <StatsCard
          title="Avaliação Média"
          value={analytics.averageRating.toString()}
          description="De 5 estrelas"
          icon={Star}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Taxa de Resposta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Taxa de Resposta
                </CardTitle>
                <CardDescription>Percentual de visualizações que resultaram em respostas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.responseRate}%</div>
                <Progress value={analytics.responseRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {analytics.totalResponses} respostas de {analytics.totalViews} visualizações
                </p>
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Mensal</CardTitle>
              <CardDescription>Biskates publicados e respostas recebidas por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="font-medium">{stat.month}</div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{stat.biskates} biskates</Badge>
                      <Badge variant="secondary">{stat.responses} respostas</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Biskates por Categoria
              </CardTitle>
              <CardDescription>Distribuição dos seus biskates por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="font-medium">{category.category}</div>
                    <div className="flex items-center gap-2">
                      <Progress value={(category.count / analytics.totalBiskates) * 100} className="w-20" />
                      <span className="text-sm text-muted-foreground w-8">{category.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
