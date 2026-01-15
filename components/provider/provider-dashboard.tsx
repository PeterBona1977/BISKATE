"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Briefcase, MessageSquare, Star, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type Gig = Database["public"]["Tables"]["gigs"]["Row"]
type GigResponse = Database["public"]["Tables"]["gig_responses"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

export function ProviderDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeGigs: 0,
    completedGigs: 0,
    totalEarnings: 0,
    averageRating: 0,
    responseRate: 0,
  })
  const [recommendedGigs, setRecommendedGigs] = useState<Gig[]>([])
  const [providerCategories, setProviderCategories] = useState<Category[]>([])
  const [activeResponses, setActiveResponses] = useState<(GigResponse & { gig: Gig })[]>([])

  useEffect(() => {
    async function loadProviderData() {
      if (!user?.id) return

      try {
        setLoading(true)

        // Carregar categorias do prestador
        const { data: categoryData, error: categoryError } = await supabase
          .from("provider_categories")
          .select(`
            category_id,
            categories (*)
          `)
          .eq("provider_id", user.id)

        if (categoryError) {
          console.error("Erro ao carregar categorias:", categoryError)
        } else if (categoryData) {
          const categories = categoryData.map((item) => item.categories).filter(Boolean) as Category[]
          setProviderCategories(categories)
        }

        // Carregar gigs recomendados baseados nas categorias
        if (categoryData?.length) {
          const categoryIds = categoryData.map((item) => item.category_id)

          const { data: gigsData, error: gigsError } = await supabase
            .from("gigs")
            .select("*")
            .in(
              "category",
              categoryIds.map((id) => id.toString()),
            )
            .eq("status", "approved")
            .is("provider_id", null)
            .order("created_at", { ascending: false })
            .limit(5)

          if (gigsError) {
            console.error("Erro ao carregar gigs recomendados:", gigsError)
          } else {
            setRecommendedGigs(gigsData || [])
          }
        }

        // Carregar respostas ativas
        const { data: responsesData, error: responsesError } = await supabase
          .from("gig_responses")
          .select(`
            *,
            gig:gigs (*)
          `)
          .eq("responder_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (responsesError) {
          console.error("Erro ao carregar respostas:", responsesError)
        } else {
          setActiveResponses((responsesData as (GigResponse & { gig: Gig })[]) || [])
        }

        // Carregar estatísticas
        // Gigs completados
        const { count: completedCount } = await supabase
          .from("gigs")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", user.id)
          .eq("status", "completed")

        // Gigs ativos
        const { count: activeCount } = await supabase
          .from("gigs")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", user.id)
          .eq("status", "in_progress")

        // Avaliação média
        const { data: profileData } = await supabase
          .from("profiles")
          .select("rating")
          .eq("id", user.id)
          .single()

        // Taxa de resposta (simplificada)
        const { count: totalResponses } = await supabase
          .from("gig_responses")
          .select("*", { count: "exact", head: true })
          .eq("responder_id", user.id)

        // Ganhos totais (simplificado)
        const { data: completedGigs } = await supabase
          .from("gigs")
          .select("price")
          .eq("provider_id", user.id)
          .eq("status", "completed")

        const totalEarnings = completedGigs?.reduce((sum, gig) => sum + gig.price, 0) || 0

        setStats({
          activeGigs: activeCount || 0,
          completedGigs: completedCount || 0,
          totalEarnings,
          averageRating: profileData?.rating || 0,
          responseRate: totalResponses ? Math.round((totalResponses / (totalResponses + 2)) * 100) : 0, // Simulação
        })
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

    loadProviderData()
  }, [user?.id, toast])

  const handleApplyToGig = async (gigId: string) => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from("gig_responses")
        .insert({
          gig_id: gigId,
          responder_id: user.id,
          status: "pending",
          message: "Estou interessado neste biskate!",
        })
        .select()

      if (error) {
        console.error("Erro ao responder ao biskate:", error)
        toast({
          title: "Erro",
          description: "Não foi possível responder ao biskate",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Sucesso",
          description: "Resposta enviada com sucesso!",
          variant: "default",
        })

        // Atualizar a lista de gigs recomendados
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
      <div>
        <h1 className="text-3xl font-bold">Área do Prestador</h1>
        <p className="text-gray-600">Gerencie seus serviços e respostas</p>

        {!isApproved && (
          <div className="mt-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
                  <div>
                    <h3 className="font-medium text-amber-800">Verificação pendente</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      {providerStatus === "pending"
                        ? "Sua conta de prestador está em análise. Você receberá uma notificação quando for aprovada."
                        : "Complete seu perfil de prestador e envie seus documentos para começar a receber biskates."}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-3 bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={() => (window.location.href = "/dashboard/provider/setup")}
                    >
                      {providerStatus === "pending" ? "Ver status" : "Completar perfil"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Biskates Ativos"
          value={stats.activeGigs.toString()}
          description="Em andamento"
          icon={Briefcase}
        />
        <StatsCard
          title="Biskates Concluídos"
          value={stats.completedGigs.toString()}
          description="Finalizados"
          icon={MessageSquare}
        />
        <StatsCard
          title="Ganhos Totais"
          value={`${stats.totalEarnings.toFixed(2)}€`}
          description="Valor recebido"
          icon={Star}
        />
        <StatsCard
          title="Avaliação"
          value={stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}
          description={stats.averageRating ? "⭐".repeat(Math.round(stats.averageRating)) : "Sem avaliações"}
          icon={Star}
        />
        <StatsCard
          title="Taxa de Resposta"
          value={`${stats.responseRate}%`}
          description="Últimos 30 dias"
          icon={Clock}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Biskates Recomendados */}
        <Card>
          <CardHeader>
            <CardTitle>Biskates Recomendados</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendedGigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Não há biskates recomendados no momento.</p>
                {providerCategories.length === 0 && (
                  <p className="mt-2 text-sm">Adicione categorias ao seu perfil para receber recomendações.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedGigs.map((gig) => (
                  <div key={gig.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{gig.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{gig.description}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge variant="outline">{gig.category}</Badge>
                          <span className="text-sm text-gray-500">{gig.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{gig.price.toFixed(2)}€</div>
                        <div className="text-xs text-gray-500">{gig.estimated_time}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" onClick={() => handleApplyToGig(gig.id)} disabled={!isApproved}>
                        Responder
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Respostas Ativas */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Respostas</CardTitle>
          </CardHeader>
          <CardContent>
            {activeResponses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Você ainda não respondeu a nenhum biskate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeResponses.map((response) => (
                  <div key={response.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{response.gig?.title || "Biskate"}</h3>
                        <div className="flex items-center mt-2">
                          <Badge
                            className={
                              response.status === "accepted"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : response.status === "rejected"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                            }
                          >
                            {response.status === "accepted"
                              ? "Aceito"
                              : response.status === "rejected"
                                ? "Rejeitado"
                                : "Pendente"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(response.created_at).toLocaleDateString("pt-PT")}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => (window.location.href = `/dashboard/gigs/${response.gig_id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
