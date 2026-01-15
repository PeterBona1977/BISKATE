"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import {
  Briefcase,
  MessageSquare,
  Star,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Settings,
  BarChart3,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Database } from "@/lib/supabase/database.types"

type Gig = Database["public"]["Tables"]["gigs"]["Row"]
type GigResponse = Database["public"]["Tables"]["gig_responses"]["Row"]
type ProviderStats = Database["public"]["Tables"]["provider_stats"]["Row"]

interface EnhancedProviderStats {
  totalGigsCompleted: number
  totalEarnings: number
  rating: number
  totalReviews: number
  responseRate: number
  completionRate: number
  repeatClientRate: number
  activeProposals: number
  pendingPayments: number
}

export function ProviderDashboardEnhanced() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EnhancedProviderStats>({
    totalGigsCompleted: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 0,
    completionRate: 0,
    repeatClientRate: 0,
    activeProposals: 0,
    pendingPayments: 0,
  })
  const [recommendedGigs, setRecommendedGigs] = useState<Gig[]>([])
  const [activeGigs, setActiveGigs] = useState<Gig[]>([])
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([])

  useEffect(() => {
    if (user?.id && profile?.is_provider) {
      loadProviderData()
    }
  }, [user?.id, profile?.is_provider])

  const loadProviderData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Carregar estatísticas do prestador
      const { data: statsData, error: statsError } = await supabase
        .from("profiles")
        .select("rating, total_reviews, total_earnings")
        .eq("id", user.id)
        .single()

      if (statsError && statsError.code !== "PGRST116") {
        console.error("Erro ao carregar estatísticas:", statsError)
      } else if (statsData) {
        setStats({
          totalGigsCompleted: 0, // Need to fetch from gigs table or elsewhere
          totalEarnings: Number.parseFloat(statsData.total_earnings?.toString() || "0"),
          rating: Number.parseFloat(statsData.rating?.toString() || "0"),
          totalReviews: statsData.total_reviews || 0,
          responseRate: 0,
          completionRate: 0,
          repeatClientRate: Number.parseFloat(statsData.repeat_client_rate?.toString() || "0"),
          activeProposals: 0, // Será calculado
          pendingPayments: 0, // Será calculado
        })
      }

      // Carregar gigs ativos
      const { data: activeGigsData, error: activeGigsError } = await supabase
        .from("gigs")
        .select("*")
        .eq("provider_id", user.id)
        .in("status", ["in_progress", "approved"])
        .order("created_at", { ascending: false })
        .limit(5)

      if (activeGigsError) {
        console.error("Erro ao carregar gigs ativos:", activeGigsError)
      } else {
        setActiveGigs(activeGigsData || [])
      }

      // Carregar gigs recomendados baseados nas categorias do prestador
      const { data: categoriesData } = await supabase
        .from("provider_categories")
        .select("category_id")
        .eq("provider_id", user.id)

      if (categoriesData?.length) {
        const categoryIds = categoriesData.map((c) => c.category_id)

        const { data: recommendedData, error: recommendedError } = await supabase
          .from("gigs")
          .select("*")
          .in(
            "category",
            categoryIds.map((id) => id.toString()),
          )
          .eq("status", "approved")
          .is("provider_id", null)
          .order("created_at", { ascending: false })
          .limit(6)

        if (!recommendedError) {
          setRecommendedGigs(recommendedData || [])
        }
      }

      // Carregar mensagens recentes
      const { data: messagesData } = await supabase
        .from("messages")
        .select(`
          *,
          conversation:conversations (
            *,
            gig:gigs (title)
          )
        `)
        .eq("receiver_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5)

      if (messagesData) {
        setRecentMessages(messagesData)
      }

      // Atualizar estatísticas se necessário
      await supabase.rpc("update_provider_stats", { provider_uuid: user.id })
    } catch (error) {
      console.error("Erro ao carregar dados do prestador:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do prestador",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToGig = async (gigId: string) => {
    if (!user?.id) return

    try {
      const { error } = await supabase.from("gig_responses").insert({
        gig_id: gigId,
        responder_id: user.id,
        status: "pending",
        message: "Estou interessado neste biskate e tenho experiência relevante para realizá-lo com qualidade.",
      })

      if (error) {
        console.error("Erro ao responder ao biskate:", error)
        toast({
          title: "Erro",
          description: "Não foi possível responder ao biskate",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Resposta enviada!",
          description: "Sua resposta foi enviada com sucesso ao cliente.",
          variant: "default",
        })

        // Remover da lista de recomendados
        setRecommendedGigs((prev) => prev.filter((gig) => gig.id !== gigId))
      }
    } catch (error) {
      console.error("Erro ao responder ao biskate:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  const providerStatus = profile?.provider_status || "inactive"
  const isApproved = providerStatus === "approved"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Área do Prestador 🚀</h1>
          <p className="text-gray-600 mt-1">Gerencie seus serviços, propostas e ganhos</p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant={isApproved ? "default" : "secondary"} className="text-sm">
            {isApproved ? "✅ Aprovado" : "⏳ Pendente"}
          </Badge>
          <Button asChild variant="outline">
            <Link href="/dashboard/provider/profile">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </Button>
        </div>
      </div>

      {/* Status de aprovação */}
      {!isApproved && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
              <div>
                <h3 className="font-medium text-amber-800">
                  {providerStatus === "pending" ? "Verificação em Análise" : "Complete seu Perfil"}
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  {providerStatus === "pending"
                    ? "Sua conta está sendo analisada. Receberá uma notificação quando for aprovada."
                    : "Complete seu perfil de prestador para começar a receber biskates."}
                </p>
                <Button
                  variant="outline"
                  className="mt-3 bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
                  asChild
                >
                  <Link
                    href={
                      providerStatus === "pending" ? "/dashboard/provider/profile" : "/dashboard/provider/onboarding"
                    }
                  >
                    {providerStatus === "pending" ? "Ver Perfil" : "Completar Perfil"}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabalhos Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGigsCompleted}</div>
            <p className="text-xs text-muted-foreground">Taxa de conclusão: {stats.completionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEarnings.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              Média por trabalho:{" "}
              {stats.totalGigsCompleted > 0 ? (stats.totalEarnings / stats.totalGigsCompleted).toFixed(2) : "0"}€
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating > 0 ? stats.rating.toFixed(1) : "N/A"}</div>
            <p className="text-xs text-muted-foreground">{stats.totalReviews} avaliações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repeatClientRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Taxa de retenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal com tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recommended">Recomendados</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Ações rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" disabled={!isApproved}>
                  <Link href="/dashboard/provider/proposals">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Ver Propostas Enviadas
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                  <Link href="/dashboard/provider/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                  <Link href="/dashboard/messages">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mensagens ({recentMessages.length})
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                  <Link href="/dashboard/provider/analytics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Progresso do perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completude do Perfil</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Informações básicas completas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Categorias selecionadas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>Adicionar mais projetos ao portfolio</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/dashboard/provider/profile">Melhorar Perfil</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommended" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biskates Recomendados para Você</CardTitle>
              <p className="text-sm text-gray-600">Baseado nas suas categorias e especialidades</p>
            </CardHeader>
            <CardContent>
              {recommendedGigs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Não há biskates recomendados no momento.</p>
                  <p className="text-sm mt-2">Complete seu perfil para receber mais recomendações.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {recommendedGigs.map((gig) => (
                    <div key={gig.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{gig.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{gig.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-green-600 text-lg">{gig.price.toFixed(2)}€</div>
                          <div className="text-xs text-gray-500">{gig.estimated_time}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{gig.category}</Badge>
                          <span className="text-sm text-gray-500">{gig.location}</span>
                        </div>
                        <Button size="sm" onClick={() => handleApplyToGig(gig.id)} disabled={!isApproved}>
                          Responder
                        </Button>
                      </div>

                      <div className="mt-3 text-xs text-gray-400">
                        Publicado em {new Date(gig.created_at).toLocaleDateString("pt-PT")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biskates Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {activeGigs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum biskate ativo no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGigs.map((gig) => (
                    <div key={gig.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{gig.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{gig.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <Badge variant={gig.status === "in_progress" ? "default" : "secondary"}>
                              {gig.status === "in_progress" ? "Em Andamento" : "Aprovado"}
                            </Badge>
                            <span className="text-sm text-gray-500">{gig.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{gig.price.toFixed(2)}€</div>
                          <Button size="sm" variant="outline" className="mt-2 bg-transparent" asChild>
                            <Link href={`/dashboard/gigs/${gig.id}`}>Ver Detalhes</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma mensagem nova.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Nova mensagem sobre: {message.conversation?.gig?.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{message.content.substring(0, 100)}...</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(message.created_at).toLocaleString("pt-PT")}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Responder
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Este Mês</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Propostas Enviadas</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Aceitação</span>
                  <span className="font-bold">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tempo Médio de Resposta</span>
                  <span className="font-bold">2h 30m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ganhos Este Mês</span>
                  <span className="font-bold text-green-600">450€</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metas e Objetivos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Meta Mensal: 1000€</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Avaliação 5⭐</span>
                    <span>80%</span>
                  </div>
                  <Progress value={80} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Projetos Concluídos</span>
                    <span>60%</span>
                  </div>
                  <Progress value={60} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
