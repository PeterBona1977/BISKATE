"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MessageSquare,
  Clock,
  CheckCircle,
  X,
  Eye,
  Star,
  MapPin,
  Calendar,
  Euro,
  User,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Database } from "@/lib/supabase/database.types"

type GigResponse = Database["public"]["Tables"]["gig_responses"]["Row"] & {
  gig: Database["public"]["Tables"]["gigs"]["Row"]
  provider: Database["public"]["Tables"]["profiles"]["Row"]
}

interface ProposalStats {
  total: number
  pending: number
  accepted: number
  rejected: number
}

export default function ProposalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [proposals, setProposals] = useState<GigResponse[]>([])
  const [stats, setStats] = useState<ProposalStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  })
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    if (user) {
      loadProposals()
    }
  }, [user])

  const loadProposals = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Buscar todas as propostas para os gigs do usuário
      const { data: userGigs, error: gigsError } = await supabase.from("gigs").select("id").eq("author_id", user.id)

      if (gigsError) {
        console.error("Erro ao carregar gigs:", gigsError)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus biskates",
          variant: "destructive",
        })
        return
      }

      const gigIds = userGigs?.map((g) => g.id) || []

      if (gigIds.length === 0) {
        setProposals([])
        setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 })
        return
      }

      // Buscar propostas com dados do gig e prestador
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("gig_responses")
        .select(`
          *,
          gig:gigs!inner (*),
          provider:profiles!gig_responses_provider_id_fkey (*)
        `)
        .in("gig_id", gigIds)
        .order("created_at", { ascending: false })

      if (proposalsError) {
        console.error("Erro ao carregar propostas:", proposalsError)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as propostas",
          variant: "destructive",
        })
        return
      }

      const typedProposals = (proposalsData as GigResponse[]) || []
      setProposals(typedProposals)

      // Calcular estatísticas
      const newStats = {
        total: typedProposals.length,
        pending: typedProposals.filter((p) => p.status === "pending").length,
        accepted: typedProposals.filter((p) => p.status === "accepted").length,
        rejected: typedProposals.filter((p) => p.status === "rejected").length,
      }
      setStats(newStats)
    } catch (error) {
      console.error("Erro ao carregar propostas:", error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar propostas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProposalAction = async (proposalId: string, action: "accept" | "reject") => {
    try {
      const { error } = await supabase
        .from("gig_responses")
        .update({
          status: action === "accept" ? "accepted" : "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId)

      if (error) {
        console.error("Erro ao atualizar proposta:", error)
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a proposta",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: `Proposta ${action === "accept" ? "aceite" : "rejeitada"} com sucesso`,
      })

      // Recarregar propostas
      loadProposals()
    } catch (error) {
      console.error("Erro ao processar ação:", error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar ação",
        variant: "destructive",
      })
    }
  }

  const getFilteredProposals = () => {
    switch (selectedTab) {
      case "pending":
        return proposals.filter((p) => p.status === "pending")
      case "accepted":
        return proposals.filter((p) => p.status === "accepted")
      case "rejected":
        return proposals.filter((p) => p.status === "rejected")
      default:
        return proposals
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Há poucos minutos"
    if (diffInHours < 24) return `Há ${diffInHours}h`
    if (diffInHours < 48) return "Ontem"
    return date.toLocaleDateString("pt-PT")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Aceite
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejeitada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando propostas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Minhas Propostas</h1>
        <p className="text-gray-600 mt-2">Gerencie as propostas recebidas para os seus biskates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aceites</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="accepted">Aceites ({stats.accepted})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {getFilteredProposals().length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedTab === "all"
                    ? "Nenhuma proposta encontrada"
                    : `Nenhuma proposta ${selectedTab === "pending" ? "pendente" : selectedTab === "accepted" ? "aceite" : "rejeitada"}`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedTab === "all"
                    ? "Quando receber propostas para os seus biskates, elas aparecerão aqui"
                    : "Não há propostas nesta categoria no momento"}
                </p>
                {selectedTab === "all" && (
                  <Link href="/dashboard/create-gig">
                    <Button>Criar Primeiro Biskate</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {getFilteredProposals().map((proposal) => (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={proposal.provider?.avatar_url || ""} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{proposal.provider?.full_name || "Prestador"}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>4.8 (23 avaliações)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(proposal.status)}
                        <span className="text-sm text-gray-500">{formatTimeAgo(proposal.created_at)}</span>
                      </div>
                    </div>

                    {/* Gig Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Proposta para: {proposal.gig?.title}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {proposal.gig?.location}
                            </div>
                            <div className="flex items-center">
                              <Euro className="h-4 w-4 mr-1" />€{Number(proposal.gig?.price || 0).toFixed(2)}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {proposal.gig?.created_at
                                ? new Date(proposal.gig.created_at).toLocaleDateString("pt-PT")
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        <Link href={`/dashboard/gigs/${proposal.gig_id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Biskate
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Proposal Message */}
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Mensagem da Proposta:</h5>
                      <p className="text-gray-700 bg-white border rounded-lg p-3">
                        {proposal.message || "Sem mensagem"}
                      </p>
                    </div>

                    {/* Proposal Details */}
                    {proposal.proposed_price && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Preço Proposto:</span>
                          <span className="font-semibold text-green-600">
                            €{Number(proposal.proposed_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Contact Info (only for accepted proposals) */}
                    {proposal.status === "accepted" && (
                      <Alert className="mb-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Proposta aceite!</strong> Pode agora contactar o prestador diretamente:
                          <div className="mt-2 space-y-1">
                            {proposal.provider?.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="h-4 w-4 mr-2" />
                                <a href={`mailto:${proposal.provider.email}`} className="text-blue-600 hover:underline">
                                  {proposal.provider.email}
                                </a>
                              </div>
                            )}
                            {proposal.provider?.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-4 w-4 mr-2" />
                                <a href={`tel:${proposal.provider.phone}`} className="text-blue-600 hover:underline">
                                  {proposal.provider.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    {proposal.status === "pending" && (
                      <div className="flex space-x-3">
                        <Button onClick={() => handleProposalAction(proposal.id, "accept")} className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aceitar Proposta
                        </Button>
                        <Button
                          onClick={() => handleProposalAction(proposal.id, "reject")}
                          variant="outline"
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}

                    {proposal.status === "accepted" && (
                      <div className="flex space-x-3">
                        <Button asChild className="flex-1">
                          <Link href={`/dashboard/chat/${proposal.provider_id}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Iniciar Conversa
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/dashboard/providers/${proposal.provider_id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
