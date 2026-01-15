"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Clock, CheckCircle, X, Star, User, Phone, Mail, ArrowLeft, ExternalLink } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import type { Database } from "@/lib/supabase/database.types"

type Gig = Database["public"]["Tables"]["gigs"]["Row"]
type GigResponse = Database["public"]["Tables"]["gig_responses"]["Row"] & {
  provider: Database["public"]["Tables"]["profiles"]["Row"]
}

export default function GigProposalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const gigId = params.id as string

  const [loading, setLoading] = useState(true)
  const [gig, setGig] = useState<Gig | null>(null)
  const [proposals, setProposals] = useState<GigResponse[]>([])

  useEffect(() => {
    if (user && gigId) {
      loadGigAndProposals()
    }
  }, [user, gigId])

  const loadGigAndProposals = async () => {
    if (!user || !gigId) return

    try {
      setLoading(true)

      // Carregar o gig
      const { data: gigData, error: gigError } = await supabase
        .from("gigs")
        .select("*")
        .eq("id", gigId)
        .eq("author_id", user.id)
        .single()

      if (gigError) {
        console.error("Erro ao carregar gig:", gigError)
        toast({
          title: "Erro",
          description: "Biskate não encontrado ou você não tem permissão para vê-lo",
          variant: "destructive",
        })
        router.push("/dashboard/my-gigs")
        return
      }

      setGig(gigData)

      // Carregar propostas
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("gig_responses")
        .select(`
          *,
          provider:profiles!gig_responses_provider_id_fkey (*)
        `)
        .eq("gig_id", gigId)
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

      setProposals((proposalsData as GigResponse[]) || [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados",
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
      loadGigAndProposals()
    } catch (error) {
      console.error("Erro ao processar ação:", error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao processar ação",
        variant: "destructive",
      })
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

  const pendingProposals = proposals.filter((p) => p.status === "pending")
  const acceptedProposals = proposals.filter((p) => p.status === "accepted")
  const rejectedProposals = proposals.filter((p) => p.status === "rejected")

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

  if (!gig) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Biskate não encontrado</h2>
        <Link href="/dashboard/my-gigs">
          <Button>Voltar aos Meus Biskates</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/gigs/${gigId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Propostas Recebidas</h1>
          <p className="text-gray-600 mt-1">
            Para o biskate: <span className="font-medium">{gig.title}</span>
          </p>
        </div>
      </div>

      {/* Gig Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Biskate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Orçamento</p>
              <p className="text-lg font-semibold text-green-600">€{Number(gig.price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Localização</p>
              <p className="text-lg font-semibold">{gig.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={gig.status === "approved" ? "default" : "secondary"}>
                {gig.status === "approved" ? "Aprovado" : gig.status === "pending" ? "Pendente" : gig.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{proposals.length}</p>
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
                <p className="text-3xl font-bold text-yellow-600">{pendingProposals.length}</p>
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
                <p className="text-3xl font-bold text-green-600">{acceptedProposals.length}</p>
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
                <p className="text-3xl font-bold text-red-600">{rejectedProposals.length}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposals */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma proposta recebida</h3>
            <p className="text-gray-600 mb-6">
              Quando prestadores enviarem propostas para este biskate, elas aparecerão aqui
            </p>
            <Link href={`/dashboard/gigs/${gigId}`}>
              <Button>Ver Detalhes do Biskate</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Proposals */}
          {pendingProposals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Propostas Pendentes ({pendingProposals.length})
              </h2>
              <div className="space-y-4">
                {pendingProposals.map((proposal) => (
                  <Card key={proposal.id} className="border-yellow-200 bg-yellow-50/30">
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

                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Mensagem da Proposta:</h5>
                        <p className="text-gray-700 bg-white border rounded-lg p-3">
                          {proposal.message || "Sem mensagem"}
                        </p>
                      </div>

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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Proposals */}
          {acceptedProposals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Propostas Aceites ({acceptedProposals.length})
              </h2>
              <div className="space-y-4">
                {acceptedProposals.map((proposal) => (
                  <Card key={proposal.id} className="border-green-200 bg-green-50/30">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Proposals */}
          {rejectedProposals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Propostas Rejeitadas ({rejectedProposals.length})
              </h2>
              <div className="space-y-4">
                {rejectedProposals.map((proposal) => (
                  <Card key={proposal.id} className="border-red-200 bg-red-50/30 opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
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
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {proposal.message || "Sem mensagem"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(proposal.status)}
                          <span className="text-sm text-gray-500">{formatTimeAgo(proposal.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
