"use client"

export const runtime = "edge"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Calendar, Activity, Briefcase } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userGigs, setUserGigs] = useState<any[]>([])
  const [userResponses, setUserResponses] = useState<any[]>([])

  const userId = params.id as string

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)

      // Buscar dados do utilizador
      const { data: userData, error: userError } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (userError) {
        console.error("Erro ao buscar utilizador:", userError)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do utilizador.",
          variant: "destructive",
        })
        return
      }

      setUser(userData)

      // Buscar gigs do utilizador
      const { data: gigsData } = await supabase
        .from("gigs")
        .select("id, title, status, created_at, price")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      setUserGigs(gigsData || [])

      // Buscar respostas do utilizador
      const { data: responsesData } = await supabase
        .from("gig_responses")
        .select(`
          id, 
          message, 
          created_at,
          gigs:gig_id (
            title
          )
        `)
        .eq("responder_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      setUserResponses(responsesData || [])
    } catch (err) {
      console.error("Erro inesperado:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "provider":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "unlimited":
        return "bg-purple-100 text-purple-800"
      case "pro":
        return "bg-green-100 text-green-800"
      case "essential":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do utilizador...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Utilizador não encontrado.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes do Utilizador</h1>
            <p className="text-gray-500 mt-1">Informações completas do utilizador</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informações Principais */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome Completo</p>
                  <p className="text-lg">{user.full_name || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{user.email}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <Badge className={getRoleBadgeColor(user.role || "user")}>
                    {user.role === 'admin' && ((user.permissions as string[])?.includes('super_admin')) ? 'Super Admin' : (user.role || "user")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Plano</p>
                  <Badge className={getPlanBadgeColor(user.plan || "free")}>{user.plan || "free"}</Badge>
                </div>
              </div>
              {user.role === 'admin' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Permissões de Administrador</p>
                    <div className="flex flex-wrap gap-2">
                      {((user.permissions as string[]) || []).length > 0 ? (
                        ((user.permissions as string[]) || []).map((perm) => (
                          <Badge key={perm} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                            {perm}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400 italic">Nenhuma permissão específica</span>
                      )}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Registo</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(user.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Respostas Utilizadas</p>
                  <p className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {user.responses_used || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biskates do Utilizador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Biskates Criados ({userGigs.length})
              </CardTitle>
              <CardDescription>Últimos biskates criados pelo utilizador</CardDescription>
            </CardHeader>
            <CardContent>
              {userGigs.length > 0 ? (
                <div className="space-y-3">
                  {userGigs.map((gig) => (
                    <div key={gig.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{gig.title}</p>
                        <p className="text-sm text-gray-500">{new Date(gig.created_at).toLocaleDateString("pt-PT")}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{gig.status}</Badge>
                        <p className="text-sm font-medium text-green-600">€{Number(gig.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum biskate criado ainda.</p>
              )}
            </CardContent>
          </Card>

          {/* Respostas do Utilizador */}
          <Card>
            <CardHeader>
              <CardTitle>Respostas a Biskates ({userResponses.length})</CardTitle>
              <CardDescription>Últimas respostas do utilizador</CardDescription>
            </CardHeader>
            <CardContent>
              {userResponses.length > 0 ? (
                <div className="space-y-3">
                  {userResponses.map((response) => (
                    <div key={response.id} className="p-3 border rounded-lg">
                      <p className="text-sm">{response.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          Biskate: {(response.gigs as any)?.title || "Título não disponível"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(response.created_at).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma resposta enviada ainda.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Ações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => router.push(`/admin/users/${userId}/edit`)}>
                Editar Utilizador
              </Button>
              <Button variant="outline" className="w-full">
                Enviar Mensagem
              </Button>
              <Button variant="outline" className="w-full text-orange-600">
                Suspender Conta
              </Button>
              <Button variant="destructive" className="w-full">
                Eliminar Conta
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Biskates Criados</span>
                <span className="font-medium">{userGigs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Respostas Enviadas</span>
                <span className="font-medium">{userResponses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Respostas Restantes</span>
                <span className="font-medium">
                  {user.plan === "unlimited" ? "∞" : Math.max(0, 10 - (user.responses_used || 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
