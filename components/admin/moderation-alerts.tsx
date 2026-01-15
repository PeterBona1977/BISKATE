"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Eye, CheckCircle, XCircle, Edit, Clock, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { SensitiveContentDetector } from "@/lib/moderation/sensitive-content-detector"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ModerationAlert {
  id: string
  content_type: string
  content_id: string
  detected_patterns: string[]
  severity: string
  status: string
  created_at: string
  metadata: any
  gigs?: any
  gig_responses?: any
}

export function ModerationAlerts() {
  const [alerts, setAlerts] = useState<ModerationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const { toast } = useToast()

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("moderation_alerts")
        .select(`
          *,
          gigs:content_id (
            id,
            title,
            description,
            author_id,
            status
          ),
          gig_responses:content_id (
            id,
            message,
            responder_id,
            gig_id
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching moderation alerts:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar alertas de moderação",
          variant: "destructive",
        })
        return
      }

      setAlerts(data || [])
    } catch (err) {
      console.error("❌ Exception fetching alerts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: string, action: "approve" | "reject" | "edit") => {
    try {
      const { error } = await supabase
        .from("moderation_alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolution_action: action,
        })
        .eq("id", alertId)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao resolver alerta",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Alerta resolvido com sucesso",
      })

      fetchAlerts()
    } catch (err) {
      console.error("❌ Error resolving alert:", err)
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

  const getContentPreview = (alert: ModerationAlert) => {
    if (alert.content_type === "gig" && alert.gigs) {
      return {
        title: alert.gigs.title,
        content: alert.gigs.description,
        link: `/admin/gigs?highlight=${alert.gigs.id}`,
      }
    } else if (alert.content_type === "gig_response" && alert.gig_responses) {
      return {
        title: "Resposta a Gig",
        content: alert.gig_responses.message || "Sem mensagem",
        link: `/admin/responses?highlight=${alert.gig_responses.id}`,
      }
    }
    return { title: "Conteúdo", content: "Não disponível", link: "#" }
  }

  const pendingAlerts = alerts.filter((a) => a.status === "pending")
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved")

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Carregando alertas...</span>
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
                      (a) => new Date(a.resolved_at || "").toDateString() === new Date().toDateString(),
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
                pendingAlerts.map((alert) => {
                  const preview = getContentPreview(alert)
                  const analysis = SensitiveContentDetector.analyzeContent(preview.content)

                  return (
                    <Card key={alert.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header do alerta */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              {getSeverityIcon(alert.severity)}
                              <div>
                                <h3 className="font-semibold text-lg">{preview.title}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge className={getSeverityColor(alert.severity)}>
                                    {alert.severity.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline">{alert.content_type === "gig" ? "Gig" : "Resposta"}</Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(alert.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Conteúdo com highlighting */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Conteúdo Detectado:</h4>
                            <div
                              className="text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: analysis.highlightedText }}
                            />
                          </div>

                          {/* Padrões detectados */}
                          <div>
                            <h4 className="font-medium mb-2">Padrões Detectados:</h4>
                            <div className="flex flex-wrap gap-2">
                              {alert.detected_patterns.map((pattern, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Sugestões */}
                          {analysis.suggestions.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Sugestões:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {analysis.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Ações */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <Link href={preview.link}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Completo
                              </Button>
                            </Link>

                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id, "edit")}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id, "approve")}
                              >
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
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4 mt-6">
              {resolvedAlerts.length === 0 ? (
                <Alert>
                  <AlertDescription>Nenhum alerta foi resolvido ainda.</AlertDescription>
                </Alert>
              ) : (
                resolvedAlerts.slice(0, 10).map((alert) => {
                  const preview = getContentPreview(alert)

                  return (
                    <Card key={alert.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{preview.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className="bg-green-100 text-green-800">Resolvido</Badge>
                              <Badge variant="outline">{alert.resolution_action?.toUpperCase()}</Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(alert.resolved_at || "").toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Link href={preview.link}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
