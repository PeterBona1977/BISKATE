"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Eye, CheckCircle, XCircle, Edit, Clock, Shield, AlertOctagon, MessageSquare, Ban, User } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ModerationAlert {
  id: string
  type: string
  target_type: string
  target_id: string
  reporter_id: string | null
  description: string | null
  metadata: any
  severity: string
  status: string
  offender_id?: string // Added for actions
  resolved_at?: string | null
  resolved_by?: string | null
  created_at: string
  updated_at: string
  // Dados relacionados
  gig_title?: string
  gig_description?: string
  user_name?: string // Reporter name
  user_email?: string // Reporter email
  offender_name?: string // Offender name
  offender_email?: string // Offender email
  resolver_name?: string
  resolver_email?: string
}

export function ModerationAlertsFixed() {
  const [alerts, setAlerts] = useState<ModerationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedAlert, setSelectedAlert] = useState<ModerationAlert | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching moderation alerts...")

      // Query simplificada para evitar joins problemáticos
      const { data: alertsData, error } = await supabase
        .from("moderation_alerts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching moderation alerts:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar alertas de moderação: " + error.message,
          variant: "destructive",
        })
        return
      }

      console.log("✅ Alerts fetched:", alertsData?.length || 0)

      // Buscar dados relacionados separadamente para evitar problemas de join
      const enrichedAlerts = await Promise.all(
        ((alertsData as any[]) || []).map(async (alert) => {
          const enrichedAlert = { ...alert } as ModerationAlert

          // Buscar dados do gig se for tipo 'gig'
          if (alert.target_type === "gig") {
            try {
              const { data: gigData } = await supabase
                .from("gigs")
                .select("title, description, author_id")
                .eq("id", alert.target_id)
                .single()

              if (gigData) {
                enrichedAlert.gig_title = gigData.title
                enrichedAlert.gig_description = gigData.description

                // Se temos author_id do gig, buscar o offender
                if (gigData.author_id) {
                  enrichedAlert.offender_id = gigData.author_id // Store ID for actions
                  const { data: offenderData } = await supabase
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", gigData.author_id)
                    .single()

                  if (offenderData) {
                    enrichedAlert.offender_name = offenderData.full_name
                    enrichedAlert.offender_email = offenderData.email
                  }
                }
              }
            } catch (err) {
              console.warn("⚠️ Error fetching gig data:", err)
            }
          }

          // Buscar dados do utilizador
          if (alert.reporter_id) {
            try {
              const { data: userData } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", alert.reporter_id)
                .single()

              if (userData) {
                enrichedAlert.user_name = userData.full_name
                enrichedAlert.user_email = userData.email
              }
            } catch (err) {
              console.warn("⚠️ Error fetching user data:", err)
            }
          }

          // Buscar dados do moderador (quem resolveu)
          if (alert.resolved_by) {
            try {
              const { data: resolverData } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", alert.resolved_by)
                .single()

              if (resolverData) {
                enrichedAlert.resolver_name = resolverData.full_name
                enrichedAlert.resolver_email = resolverData.email
              }
            } catch (err) {
              console.warn("⚠️ Error fetching resolver data:", err)
            }
          }

          return enrichedAlert
        }),
      )

      setAlerts(enrichedAlerts)
    } catch (err) {
      console.error("❌ Exception fetching alerts:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar alertas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (alert: ModerationAlert) => {
    setSelectedAlert(alert)
    setIsDetailOpen(true)
  }

  const handleWarnUser = async () => {
    if (!selectedAlert?.offender_id) return

    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: selectedAlert.offender_id,
        title: "Aviso de Moderação",
        message: warningMessage,
        type: "alert"
      })

      if (error) throw error

      toast({
        title: "Aviso enviado",
        description: "O utilizador foi notificado com sucesso."
      })
      setIsWarningDialogOpen(false)
      setWarningMessage("")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao enviar aviso: " + error.message,
        variant: "destructive"
      })
    }
  }

  const handleBanUser = async () => {
    if (!selectedAlert?.offender_id) return

    if (!confirm("Tem a certeza que deseja BANIR este utilizador? Esta ação irá remover o utilizador do sistema.")) return

    try {
      // Ban by deleting user from profiles
      const { error } = await supabase.from("profiles").delete().eq("id", selectedAlert.offender_id)

      if (error) throw error

      toast({
        title: "Utilizador Banido",
        description: "O utilizador foi removido do sistema."
      })
      setIsDetailOpen(false)
      fetchAlerts()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao banir utilizador: " + error.message,
        variant: "destructive"
      })
    }
  }

  const handleResolveAlert = async (alertId: string, action: "approve" | "reject" | "edit") => {
    try {
      console.log(`🔧 Resolving alert ${alertId} with action: ${action}`)

      const { error } = await supabase
        .from("moderation_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", alertId)

      if (error) {
        console.error("❌ Error resolving alert:", error)
        toast({
          title: "Erro",
          description: "Erro ao resolver alerta: " + error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: `Alerta ${action === "approve" ? "aprovado" : action === "reject" ? "rejeitado" : "marcado para edição"} com sucesso`,
      })

      // Recarregar alertas
      fetchAlerts()
    } catch (err) {
      console.error("❌ Error resolving alert:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao resolver alerta",
        variant: "destructive",
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-600" />
    }
  }

  const pendingAlerts = alerts.filter((a) => a.status === "pending")
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved")

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Carregando alertas de moderação...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Pendentes</p>
                <p className="text-2xl font-bold text-red-600">{pendingAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Críticos</p>
                <p className="text-2xl font-bold text-red-800">
                  {pendingAlerts.filter((a) => a.severity === "critical").length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-800" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolvidos Hoje</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    resolvedAlerts.filter(
                      (a) => a.resolved_at && new Date(a.resolved_at).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Alertas</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Alertas de Moderação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Pendentes ({pendingAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolvidos ({resolvedAlerts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {pendingAlerts.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>🎉 Excelente! Não há alertas pendentes no momento.</AlertDescription>
                </Alert>
              ) : (
                pendingAlerts.map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header do alerta */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {getSeverityIcon(alert.severity)}
                            <div>
                              <h3 className="font-semibold text-lg">
                                {alert.gig_title || alert.description || `Conteúdo ${alert.target_type}`}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getSeverityColor(alert.severity)}>
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{alert.type.toUpperCase()}</Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(alert.created_at).toLocaleString("pt-PT")}
                                </span>
                              </div>
                              {alert.user_name && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Por: <strong>{alert.user_name}</strong> ({alert.user_email})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Descrição */}
                        {alert.description && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Descrição:</h4>
                            <p className="text-sm leading-relaxed">{alert.description}</p>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-gray-500">ID: {alert.target_id?.slice(0, 8) || 'N/A'}...</div>

                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenDetail(alert)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id, "edit")}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id, "approve")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id, "reject")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4 mt-6">
              {resolvedAlerts.length === 0 ? (
                <Alert>
                  <AlertDescription>Nenhum alerta foi resolvido ainda.</AlertDescription>
                </Alert>
              ) : (
                resolvedAlerts.map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{alert.gig_title || alert.description || `Alerta ${alert.type}`}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className="bg-green-100 text-green-800">Resolvido</Badge>
                            <span className="text-sm text-gray-500">
                              {alert.resolved_at && new Date(alert.resolved_at).toLocaleString("pt-PT")}
                            </span>
                            <Button variant="ghost" size="sm" className="ml-2 h-6 px-2" onClick={() => handleOpenDetail(alert)}>
                              <Eye className="h-3 w-3 mr-1" /> Detalhes
                            </Button>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-md">
                            <div>
                              <span className="font-semibold block text-gray-700">Origem:</span>
                              <span className="text-gray-600 capitalize">{alert.target_type === 'gig' ? 'Anúncio (Gig)' : 'Resposta'}</span>
                              {alert.user_name && <span className="text-gray-500 block text-xs mt-0.5">Reportado por: {alert.user_name}</span>}
                              {alert.offender_name && <span className="text-red-500 block text-xs mt-0.5">Infrator: {alert.offender_name}</span>}
                            </div>
                            <div>
                              <span className="font-semibold block text-gray-700">Resolvido por:</span>
                              <span className="text-gray-600">{alert.resolver_name || 'Admin Desconhecido'}</span>
                              {alert.resolver_email && <span className="text-gray-500 block text-xs mt-0.5">{alert.resolver_email}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detalhes do Alerta Popup */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Moderação</DialogTitle>
            <DialogDescription>
              Informação completa sobre o alerta #{selectedAlert?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-500">Tipo de Alerta</Label>
                  <div className="font-medium capitalize">{selectedAlert.type}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Severidade</Label>
                  <div><Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge></div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Data de Criação</Label>
                  <div className="text-sm">{new Date(selectedAlert.created_at).toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500">Estado Online</Label>
                  <div><Badge variant="outline">{selectedAlert.status}</Badge></div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <Label className="text-gray-500">Conteúdo Reportado</Label>
                <h3 className="font-bold text-lg">{selectedAlert.gig_title || "Conteúdo sem título"}</h3>
                <p className="text-gray-700">{selectedAlert.gig_description || selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t pt-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center"><User className="h-4 w-4 mr-2" /> Reportado por</h4>
                  {selectedAlert.user_name ? (
                    <div className="text-sm">
                      <div className="font-medium">{selectedAlert.user_name}</div>
                      <div className="text-gray-500">{selectedAlert.user_email}</div>
                    </div>
                  ) : <span className="text-gray-400 text-sm">Anônimo</span>}
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center text-red-600"><AlertOctagon className="h-4 w-4 mr-2" /> Infrator (Conteúdo)</h4>
                  {selectedAlert.offender_name ? (
                    <div className="text-sm">
                      <div className="font-medium">{selectedAlert.offender_name}</div>
                      <div className="text-gray-500">{selectedAlert.offender_email}</div>
                      <div className="flex mt-2 space-x-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsWarningDialogOpen(true)}>
                          <MessageSquare className="h-3 w-3 mr-1" /> Avisar
                        </Button>
                        <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleBanUser}>
                          <Ban className="h-3 w-3 mr-1" /> Banir
                        </Button>
                      </div>
                    </div>
                  ) : <span className="text-gray-400 text-sm">Desconhecido</span>}
                </div>
              </div>

              {selectedAlert.resolved_at && (
                <div className="bg-green-50 p-4 rounded-md border border-green-100 mt-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center"><CheckCircle className="h-4 w-4 mr-2" /> Resolução</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 block">Resolvido por:</span>
                      <span className="font-medium">{selectedAlert.resolver_name || 'Admin'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">Data de Resolução:</span>
                      <span>{new Date(selectedAlert.resolved_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Fechar</Button>
            {selectedAlert?.status === 'pending' && (
              <Button onClick={() => { setIsDetailOpen(false); handleResolveAlert(selectedAlert.id, "approve") }}>Aprovar Conteúdo</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Aviso */}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Aviso ao Utilizador</DialogTitle>
            <DialogDescription>
              Este aviso será enviado como uma notificação para o utilizador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mensagem de Aviso</Label>
              <Textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Ex: Seu conteúdo viola nossas políticas de comunidade..."
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWarningDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleWarnUser} disabled={!warningMessage.trim()}>Enviar Aviso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
