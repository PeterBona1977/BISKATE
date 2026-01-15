"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  Users,
  FileText,
  Euro,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Target,
  CreditCard,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { ContactViewService } from "@/lib/monetization/contact-view-service"

interface AnalyticsData {
  users: {
    total: number
    newThisMonth: number
    activeThisWeek: number
    byPlan: Record<string, number>
  }
  gigs: {
    total: number
    approved: number
    pending: number
    byCategory: Record<string, number>
    totalValue: number
  }
  responses: {
    total: number
    thisMonth: number
    conversionRate: number
  }
  revenue: {
    totalCreditsUsed: number
    revenueThisMonth: number
    topSpenders: Array<{ userId: string; userName: string; spent: number }>
  }
  contactViews: {
    totalViews: number
    totalRevenue: number
    viewsToday: number
  }
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)

      // Buscar dados em paralelo
      const [usersResult, gigsResult, responsesResult, profilesResult, contactViewsResult] = await Promise.all([
        supabase.from("profiles").select("id, created_at, plan"),
        supabase.from("gigs").select("id, status, category, price, created_at"),
        supabase.from("gig_responses").select("id, created_at"),
        supabase.from("profiles").select("id, responses_used, plan, full_name"),
        ContactViewService.getContactViewStats(),
      ])

      const users = usersResult.data || []
      const gigs = gigsResult.data || []
      const responses = responsesResult.data || []
      const profiles = profilesResult.data || []

      // Calcular datas
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Análise de utilizadores
      const newUsersThisMonth = users.filter((u) => new Date(u.created_at) >= thisMonthStart).length
      const activeUsersThisWeek = users.filter((u) => new Date(u.created_at) >= sevenDaysAgo).length

      const usersByPlan = users.reduce(
        (acc, user) => {
          acc[user.plan] = (acc[user.plan] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // Análise de gigs
      const approvedGigs = gigs.filter((g) => g.status === "approved").length
      const pendingGigs = gigs.filter((g) => g.status === "pending").length

      const gigsByCategory = gigs.reduce(
        (acc, gig) => {
          acc[gig.category] = (acc[gig.category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const totalGigValue = gigs.reduce((sum, gig) => sum + Number(gig.price || 0), 0)

      // Análise de respostas
      const responsesThisMonth = responses.filter((r) => new Date(r.created_at) >= thisMonthStart).length
      const conversionRate = gigs.length > 0 ? (responses.length / gigs.length) * 100 : 0

      // Análise de receita
      const totalCreditsUsed = profiles.reduce((sum, p) => sum + (p.responses_used || 0), 0)

      // Top spenders (utilizadores que mais gastaram créditos)
      const topSpenders = profiles
        .filter((p) => p.responses_used > 0)
        .sort((a, b) => (b.responses_used || 0) - (a.responses_used || 0))
        .slice(0, 5)
        .map((p) => ({
          userId: p.id,
          userName: p.full_name || "Utilizador",
          spent: p.responses_used || 0,
        }))

      const revenueThisMonth = profiles
        .filter((p) => p.responses_used > 0)
        .reduce((sum, p) => sum + (p.responses_used || 0), 0) // Simplificado para este exemplo

      setAnalytics({
        users: {
          total: users.length,
          newThisMonth: newUsersThisMonth,
          activeThisWeek: activeUsersThisWeek,
          byPlan: usersByPlan,
        },
        gigs: {
          total: gigs.length,
          approved: approvedGigs,
          pending: pendingGigs,
          byCategory: gigsByCategory,
          totalValue: totalGigValue,
        },
        responses: {
          total: responses.length,
          thisMonth: responsesThisMonth,
          conversionRate,
        },
        revenue: {
          totalCreditsUsed,
          revenueThisMonth,
          topSpenders,
        },
        contactViews: contactViewsResult,
      })
    } catch (err) {
      console.error("❌ Error fetching analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (type: string) => {
    // Implementar exportação de dados
    console.log("Exporting data:", type)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-gray-500">Error loading analytics data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics and Reports</h2>
          <p className="text-gray-600">Detailed insights into the platform's performance</p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportData("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.users.total}</p>
                <p className="text-sm text-green-600">+{analytics.users.newThisMonth} this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Gigs</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.gigs.approved}</p>
                <p className="text-sm text-yellow-600">{analytics.gigs.pending} pending</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.responses.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">{analytics.responses.total} total responses</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue (Credits)</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.revenue.totalCreditsUsed}</p>
                <p className="text-sm text-green-600">{analytics.contactViews.viewsToday} views today</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de análises detalhadas */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="gigs">Gigs</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Distribution by Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.users.byPlan).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{plan.toUpperCase()}</Badge>
                        <span className="text-sm text-gray-600">{count} users</span>
                      </div>
                      <div className="text-sm font-medium">{((count / analytics.users.total) * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New users (30d)</span>
                    <span className="font-medium">{analytics.users.newThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active this week</span>
                    <span className="font-medium">{analytics.users.activeThisWeek}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Retention rate</span>
                    <span className="font-medium text-green-600">
                      {analytics.users.total > 0
                        ? ((analytics.users.activeThisWeek / analytics.users.total) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gigs" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Gigs by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.gigs.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / analytics.gigs.total) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-sm">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Euro className="h-5 w-5 mr-2" />
                  Gigs Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">€{analytics.gigs.totalValue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Total value in gigs</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{analytics.gigs.approved}</p>
                      <p className="text-xs text-gray-600">Approved</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-yellow-600">{analytics.gigs.pending}</p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Revenue by Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">{analytics.contactViews.totalViews}</p>
                    <p className="text-sm text-gray-600">Total views</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{analytics.contactViews.viewsToday}</p>
                      <p className="text-xs text-gray-600">Today</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-600">{analytics.revenue.totalCreditsUsed}</p>
                      <p className="text-xs text-gray-600">Credits spent</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Top Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.revenue.topSpenders.map((spender, index) => (
                    <div key={spender.userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="text-sm text-gray-600">{spender.userName}</span>
                      </div>
                      <span className="font-medium">{spender.spent} credits</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {analytics.gigs.total > 0 ? ((analytics.gigs.approved / analytics.gigs.total) * 100).toFixed(1) : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-600">Approved gigs</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{analytics.responses.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Response rate</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monetization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics.users.total > 0
                      ? (analytics.revenue.totalCreditsUsed / analytics.users.total).toFixed(1)
                      : 0}
                  </p>
                  <p className="text-sm text-gray-600">Credits per user</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
