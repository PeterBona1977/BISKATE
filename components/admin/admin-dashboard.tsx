"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"
import { PieChart, BarChart, LineChart } from "lucide-react"
import { StatCard } from "./stat-card"
import { RecentActivity } from "./recent-activity"
import { useTranslations } from "next-intl"

export function AdminDashboard() {
  const t = useTranslations("Admin.Dashboard")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGigs: 0,
    totalResponses: 0,
    pendingModeration: 0,
    activeUsers: 0,
    premiumUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)

        // Fetch user stats
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("role, plan", { count: "exact" })

        if (usersError) throw usersError

        // Fetch gigs stats
        const { count: gigsCount, error: gigsError } = await supabase
          .from("gigs")
          .select("*", { count: "exact", head: true })

        if (gigsError) throw gigsError

        // Fetch responses stats
        const { count: responsesCount, error: responsesError } = await supabase
          .from("gig_responses")
          .select("*", { count: "exact", head: true })

        if (responsesError) throw responsesError

        // Fetch moderation alerts
        const { count: moderationCount, error: moderationError } = await supabase
          .from("moderation_alerts")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")

        if (moderationError) throw moderationError
        // Calculate stats
        const totalUsers = usersData?.length || 0
        const premiumUsers = usersData?.filter((u) => u.plan !== "free").length || 0
        const adminUsers = usersData?.filter((u) => u.role === "admin").length || 0

        setStats({
          totalUsers,
          totalGigs: gigsCount || 0,
          totalResponses: responsesCount || 0,
          pendingModeration: moderationCount || 0,
          activeUsers: totalUsers - adminUsers,
          premiumUsers,
        })
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>{error}</p>
            <p className="text-sm text-gray-500 mt-2">
              Check access permissions or try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>{t("tabs.overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>{t("tabs.users")}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>{t("tabs.activity")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={t("stats.totalUsers")}
              value={stats.totalUsers}
              description={t("cards.registeredUsers")}
              loading={loading}
              trend="up"
              trendValue="+12%"
            />
            <StatCard
              title={t("stats.activeGigs")}
              value={stats.totalGigs}
              description={t("cards.publishedGigs")}
              loading={loading}
              trend="up"
              trendValue="+18%"
            />
            <StatCard
              title={t("stats.responses")}
              value={stats.totalResponses}
              description={t("cards.gigResponses")}
              loading={loading}
              trend="up"
              trendValue="+7%"
            />
            <StatCard
              title={t("stats.premiumUsers")}
              value={stats.premiumUsers}
              description={t("cards.usersWithPaidPlans")}
              loading={loading}
              trend="up"
              trendValue="+5%"
            />
            <StatCard
              title={t("stats.activeUsers")}
              value={stats.activeUsers}
              description={t("cards.regularUsers")}
              loading={loading}
              trend="neutral"
              trendValue="0%"
            />
            <StatCard
              title={t("stats.moderationAlerts")}
              value={stats.pendingModeration}
              description={t("cards.pendingReview")}
              loading={loading}
              trend="down"
              trendValue="-3%"
              valueClassName={stats.pendingModeration > 0 ? "text-amber-600" : "text-green-600"}
            />
          </div>

          {/* System Status */}
          <RecentActivity loading={loading} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.userDistribution.title")}</CardTitle>
              <CardDescription>{t("charts.userDistribution.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">User distribution chart</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.platformActivity.title")}</CardTitle>
              <CardDescription>{t("charts.platformActivity.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Platform activity chart</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
