"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { Download, TrendingUp, Users, Briefcase, MessageSquare, Euro } from "lucide-react"
import { subDays, startOfDay } from "date-fns"

type AnalyticsData = {
  userGrowth: { date: string; count: number }[]
  gigsByCategory: { category: string; count: number }[]
  responseRates: { date: string; rate: number }[]
  revenueData: { date: string; amount: number }[]
  topPerformers: { email: string; gigs_count: number; responses_count: number }[]
}

export function AnalyticsAdvanced() {
  const [data, setData] = useState<AnalyticsData>({
    userGrowth: [],
    gigsByCategory: [],
    responseRates: [],
    revenueData: [],
    topPerformers: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  async function fetchAnalyticsData() {
    try {
      setLoading(true)
      const daysAgo = Number.parseInt(timeRange)
      const startDate = startOfDay(subDays(new Date(), daysAgo))

      // User growth over time
      const { data: userGrowthData, error: userGrowthError } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at")

      if (userGrowthError) throw userGrowthError

      // Gigs by category
      const { data: gigsCategoryData, error: gigsCategoryError } = await supabase
        .from("gigs")
        .select("category")
        .gte("created_at", startDate.toISOString())

      if (gigsCategoryError) throw gigsCategoryError

      // Top performers (users with most gigs and responses)
      const { data: topPerformersData, error: topPerformersError } = await supabase
        .from("profiles")
        .select(`
          email,
          gigs:gigs!author_id (count),
          responses:gig_responses!responder_id (count)
        `)
        .limit(10)

      if (topPerformersError) throw topPerformersError

      // Process user growth data
      const userGrowthProcessed = processUserGrowthData(userGrowthData || [])

      // Process gigs by category
      const gigsByCategoryProcessed = processGigsByCategory(gigsCategoryData || [])

      // Process top performers
      const topPerformersProcessed = (topPerformersData || [])
        .map((user) => ({
          email: user.email,
          gigs_count: user.gigs?.[0]?.count || 0,
          responses_count: user.responses?.[0]?.count || 0,
        }))
        .filter((user) => user.gigs_count > 0 || user.responses_count > 0)
        .sort((a, b) => b.gigs_count + b.responses_count - (a.gigs_count + a.responses_count))
        .slice(0, 5)

      setData({
        userGrowth: userGrowthProcessed,
        gigsByCategory: gigsByCategoryProcessed,
        responseRates: [], // Placeholder
        revenueData: [], // Placeholder
        topPerformers: topPerformersProcessed,
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  function processUserGrowthData(users: any[]) {
    const dailyCounts: { [key: string]: number } = {}

    users.forEach((user) => {
      const date = new Date(user.created_at).toISOString().split("T")[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })

    return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
  }

  function processGigsByCategory(gigs: any[]) {
    const categoryCounts: { [key: string]: number } = {}

    gigs.forEach((gig) => {
      const category = gig.category || "Sem categoria"
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    })

    return Object.entries(categoryCounts).map(([category, count]) => ({ category, count }))
  }

  async function exportData() {
    try {
      // Create CSV data
      const csvData = [
        ["Métrica", "Valor"],
        ["Total de Utilizadores", data.userGrowth.reduce((sum, item) => sum + item.count, 0)],
        ["Total de Biskates", data.gigsByCategory.reduce((sum, item) => sum + item.count, 0)],
        [
          "Categorias Mais Populares",
          data.gigsByCategory
            .slice(0, 3)
            .map((item) => `${item.category} (${item.count})`)
            .join(", "),
        ],
      ]

      const csvContent = csvData.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `biskate-analytics-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Avançadas</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Utilizadores</TabsTrigger>
          <TabsTrigger value="gigs">Biskates</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Utilizadores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : data.userGrowth.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Últimos {timeRange} dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Biskates Criados</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : data.gigsByCategory.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Últimos {timeRange} dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : "73%"}</div>
                <p className="text-xs text-muted-foreground">+5% vs período anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : "€2,450"}</div>
                <p className="text-xs text-muted-foreground">+12% vs período anterior</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts placeholder */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Utilizadores</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{data.userGrowth.length} registos de crescimento</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Biskates por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.gigsByCategory.slice(0, 5).map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(item.count / Math.max(...data.gigsByCategory.map((g) => g.count))) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Utilizadores mais ativos na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {data.topPerformers.map((performer, index) => (
                    <div key={performer.email} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{performer.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {performer.gigs_count} biskates • {performer.responses_count} respostas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {performer.gigs_count + performer.responses_count} atividades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
