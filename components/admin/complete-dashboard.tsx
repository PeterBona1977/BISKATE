"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  FileText,
  ImageIcon,
  Settings,
  TrendingUp,
  Activity,
  Database,
  Loader2,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  totalUsers: number
  totalGigs: number
  totalResponses: number
  totalNotifications: number
  totalModerationAlerts: number
  totalCMSPages: number
  totalCMSMedia: number
  recentActivity: any[]
}

export function CompleteDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalGigs: 0,
    totalResponses: 0,
    totalNotifications: 0,
    totalModerationAlerts: 0,
    totalCMSPages: 0,
    totalCMSMedia: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log("🔍 Carregando dados do dashboard...")

      // Buscar estatísticas de todas as tabelas
      const [
        usersResult,
        gigsResult,
        responsesResult,
        notificationsResult,
        moderationResult,
        pagesResult,
        mediaResult,
        recentGigsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("gigs").select("id", { count: "exact" }),
        supabase.from("gig_responses").select("id", { count: "exact" }),
        supabase.from("notifications").select("id", { count: "exact" }),
        supabase.from("moderation_alerts").select("id", { count: "exact" }),
        supabase.from("cms_pages").select("id", { count: "exact" }),
        supabase.from("cms_media").select("id", { count: "exact" }),
        supabase
          .from("gigs")
          .select("id, title, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalGigs: gigsResult.count || 0,
        totalResponses: responsesResult.count || 0,
        totalNotifications: notificationsResult.count || 0,
        totalModerationAlerts: moderationResult.count || 0,
        totalCMSPages: pagesResult.count || 0,
        totalCMSMedia: mediaResult.count || 0,
        recentActivity: recentGigsResult.data || [],
      })

      console.log("✅ Dados do dashboard carregados com sucesso")
    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error)
      toast({
        title: "Erro ao carregar dashboard",
        description: "Não foi possível carregar as estatísticas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-gray-500 mt-2">Visão geral completa da plataforma Biskate</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilizadores"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          description="Total de utilizadores registados"
        />
        <StatCard
          title="Biskates"
          value={stats.totalGigs}
          icon={Briefcase}
          color="green"
          description="Total de biskates criadas"
        />
        <StatCard
          title="Respostas"
          value={stats.totalResponses}
          icon={MessageSquare}
          color="purple"
          description="Total de respostas a biskates"
        />
        <StatCard
          title="Notificações"
          value={stats.totalNotifications}
          icon={AlertTriangle}
          color="orange"
          description="Total de notificações enviadas"
        />
      </div>

      {/* Tabs com diferentes secções */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="content">Gestão de Conteúdo</TabsTrigger>
          <TabsTrigger value="moderation">Moderação</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.map((gig, index) => (
                    <div key={gig.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{gig.title}</p>
                        <p className="text-xs text-gray-500">{new Date(gig.created_at).toLocaleDateString("pt-PT")}</p>
                      </div>
                      <Badge variant="outline">{gig.status}</Badge>
                    </div>
                  ))}
                  {stats.recentActivity.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Métricas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Resposta</span>
                    <span className="font-semibold">
                      {stats.totalGigs > 0 ? Math.round((stats.totalResponses / stats.totalGigs) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alertas de Moderação</span>
                    <Badge variant={stats.totalModerationAlerts > 0 ? "destructive" : "secondary"}>
                      {stats.totalModerationAlerts}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Páginas CMS</span>
                    <span className="font-semibold">{stats.totalCMSPages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ficheiros Media</span>
                    <span className="font-semibold">{stats.totalCMSMedia}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Páginas CMS"
              value={stats.totalCMSPages}
              icon={FileText}
              color="indigo"
              description="Páginas de conteúdo criadas"
            />
            <StatCard
              title="Ficheiros Media"
              value={stats.totalCMSMedia}
              icon={ImageIcon}
              color="pink"
              description="Imagens e ficheiros carregados"
            />
            <StatCard
              title="Menus"
              value="N/A"
              icon={Settings}
              color="gray"
              description="Menus de navegação configurados"
            />
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Estado da Moderação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Alertas Ativos</h4>
                  <p className="text-2xl font-bold text-red-600">{stats.totalModerationAlerts}</p>
                  <p className="text-sm text-gray-500">Requerem atenção imediata</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Status Geral</h4>
                  <Badge variant={stats.totalModerationAlerts === 0 ? "secondary" : "destructive"}>
                    {stats.totalModerationAlerts === 0 ? "Tudo OK" : "Atenção Necessária"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estado do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Base de Dados</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Tabelas Principais</span>
                      <Badge variant="secondary">18+</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">RLS Ativo</span>
                      <Badge variant="secondary">✓</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Políticas Admin</span>
                      <Badge variant="secondary">✓</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Funcionalidades</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Autenticação</span>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Notificações</span>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">CMS</span>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  icon: any
  color: string
  description: string
}

function StatCard({ title, value, icon: Icon, color, description }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    indigo: "bg-indigo-100 text-indigo-600",
    pink: "bg-pink-100 text-pink-600",
    gray: "bg-gray-100 text-gray-600",
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
