"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Star,
  MessageSquare,
  Eye,
  Briefcase,
  ArrowRight,
  Calendar,
  MapPin,
  Euro,
  Lightbulb,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Database } from "@/lib/supabase/database.types"

type Gig = Database["public"]["Tables"]["gigs"]["Row"]
type GigResponse = Database["public"]["Tables"]["gig_responses"]["Row"]

interface DashboardStats {
  totalGigs: number
  activeGigs: number
  completedGigs: number
  totalProposals: number
  pendingProposals: number
  acceptedProposals: number
}

interface RecommendedProvider {
  id: string
  full_name: string
  bio: string
  avatar_url: string
  total_reviews: number
  rating: number
  specialties: string[]
  hourly_rate: number
}

interface RecentActivity {
  id: string
  type: "gig_created" | "proposal_received" | "gig_completed" | "message_received"
  title: string
  description: string
  timestamp: string
  gig_id?: string
  user_name?: string
}

export function EnhancedClientDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalGigs: 0,
    activeGigs: 0,
    completedGigs: 0,
    totalProposals: 0,
    pendingProposals: 0,
    acceptedProposals: 0,
  })
  const [recentGigs, setRecentGigs] = useState<Gig[]>([])
  const [recommendedProviders, setRecommendedProviders] = useState<RecommendedProvider[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Carregar gigs do usuário
      const { data: userGigs, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })

      if (gigsError) {
        console.error("Erro ao carregar gigs:", gigsError)
        toast({
          title: "Erro",
          description: "Could not load your gigs",
          variant: "destructive",
        })
        return
      }

      setRecentGigs(userGigs?.slice(0, 3) || [])

      // Carregar propostas recebidas
      const gigIds = userGigs?.map((g) => g.id) || []
      let allProposals: GigResponse[] = []

      if (gigIds.length > 0) {
        const { data: proposals, error: proposalsError } = await supabase
          .from("gig_responses")
          .select(`
            *,
            gigs!inner (
              author_id
            )
          `)
          .in("gig_id", gigIds)

        if (!proposalsError && proposals) {
          allProposals = proposals.filter((p) => p.gigs?.author_id === user.id)
        }
      }

      // Calcular estatísticas
      const newStats: DashboardStats = {
        totalGigs: userGigs?.length || 0,
        activeGigs: userGigs?.filter((g) => g.status === "approved" || g.status === "in_progress").length || 0,
        completedGigs: userGigs?.filter((g) => g.status === "completed").length || 0,
        totalProposals: allProposals.length,
        pendingProposals: allProposals.filter((p) => p.status === "pending").length,
        acceptedProposals: allProposals.filter((p) => p.status === "accepted").length,
      }

      setStats(newStats)

      // Carregar prestadores recomendados
      await loadRecommendedProviders()

      // Carregar atividade recente
      await loadRecentActivity(userGigs || [], allProposals)
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
      toast({
        title: "Erro",
        description: "Error loading dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendedProviders = async () => {
    try {
      const { data: providers, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "provider")
        .not("bio", "is", null)
        .limit(3)

      if (!error && providers) {
        setRecommendedProviders(
          providers.map((p) => ({
            id: p.id,
            full_name: p.full_name || "Name not provided",
            bio: p.bio || "No description",
            avatar_url: p.avatar_url || "",
            total_reviews: p.total_reviews || 0,
            rating: p.rating || 0,
            specialties: ["General"], // Placeholder
            hourly_rate: p.hourly_rate || 25,
          })),
        )
      }
    } catch (error) {
      console.error("Erro ao carregar prestadores:", error)
    }
  }

  const loadRecentActivity = async (gigs: Gig[], proposals: GigResponse[]) => {
    const activities: RecentActivity[] = []

    // Adicionar gigs criados recentemente
    gigs.slice(0, 2).forEach((gig) => {
      activities.push({
        id: `gig-${gig.id}`,
        type: "gig_created",
        title: "Gig created",
        description: `Created the gig "${gig.title}"`,
        timestamp: gig.created_at,
        gig_id: gig.id,
      })
    })

    // Adicionar propostas recebidas recentemente
    proposals.slice(0, 2).forEach((proposal) => {
      activities.push({
        id: `proposal-${proposal.id}`,
        type: "proposal_received",
        title: "New proposal",
        description: `Received a proposal for one of your gigs`,
        timestamp: proposal.created_at,
        gig_id: proposal.gig_id,
      })
    })

    // Ordenar por data
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setRecentActivity(activities.slice(0, 5))
  }

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "gig_created":
        return <Plus className="h-4 w-4 text-blue-600" />
      case "proposal_received":
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case "gig_completed":
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case "message_received":
        return <MessageSquare className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "A few minutes ago"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString("en-US")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {profile?.full_name || user?.email?.split("@")[0]}! 👋
            </h1>
            <p className="text-indigo-100">
              Manage your gigs and find the best providers for your projects
            </p>
          </div>
          <div className="hidden md:block">
            <Link href="/dashboard/create-gig">
              <Button variant="secondary" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Gig
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gigs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalGigs}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Gigs</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeGigs}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Proposals Received</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalProposals}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.totalGigs > 0 ? Math.round((stats.completedGigs / stats.totalGigs) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gigs">My Gigs</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/create-gig">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Gig
                  </Button>
                </Link>
                <Link href="/dashboard/responses">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Proposals ({stats.pendingProposals} pending)
                  </Button>
                </Link>
                <Link href="/dashboard/provider/onboarding">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Become a Provider
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Projects Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Gigs Completed</span>
                    <span>
                      {stats.completedGigs}/{stats.totalGigs}
                    </span>
                  </div>
                  <Progress
                    value={stats.totalGigs > 0 ? (stats.completedGigs / stats.totalGigs) * 100 : 0}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Proposals Accepted</span>
                    <span>
                      {stats.acceptedProposals}/{stats.totalProposals}
                    </span>
                  </div>
                  <Progress
                    value={stats.totalProposals > 0 ? (stats.acceptedProposals / stats.totalProposals) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gigs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Gigs</h3>
            <Link href="/dashboard/my-gigs">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {recentGigs.length > 0 ? (
            <div className="grid gap-4">
              {recentGigs.map((gig) => (
                <Card key={gig.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{gig.title}</h4>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{gig.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="font-medium mr-1">$</span>{Number(gig.price).toFixed(2)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {gig.location}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatTimeAgo(gig.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={gig.status === "approved" ? "default" : "secondary"}
                          className={
                            gig.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : gig.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {gig.status === "approved" ? "Approved" : gig.status === "pending" ? "Pending" : gig.status}
                        </Badge>
                        <Link href={`/dashboard/gigs/${gig.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs created yet</h3>
                <p className="text-gray-600 mb-6">Start by creating your first gig to find providers</p>
                <Link href="/dashboard/create-gig">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Gig
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recommended Providers</h3>
            <Link href="/dashboard/providers">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {recommendedProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedProviders.map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={provider.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{provider.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{provider.full_name}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{provider.bio}</p>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm">{provider.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-gray-500">({provider.total_reviews} avaliações)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-600">€{provider.hourly_rate}/hora</span>
                          <Button size="sm" variant="outline">
                            Ver Perfil
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-600">Providers will appear here based on your gig history</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>

          {recentActivity.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                      {activity.gig_id && (
                        <Link href={`/dashboard/gigs/${activity.gig_id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                <p className="text-gray-600">Your activity will appear here as you use the platform</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      {profile?.user_type !== "provider" && (
        <Alert>
          <Briefcase className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 Tip:</strong> Want to earn money? Become a provider and start offering your services
            on the platform.{" "}
            <Link href="/dashboard/provider/onboarding" className="font-medium text-indigo-600 hover:text-indigo-500">
              Learn more →
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
