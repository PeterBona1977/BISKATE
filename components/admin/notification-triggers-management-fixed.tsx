"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Plus, Edit, Trash2, Settings, MessageSquare, Zap, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { NotificationRuleEditor } from "./notification-rule-editor"
import { AVAILABLE_TRIGGERS, AVAILABLE_CHANNELS, AVAILABLE_RECIPIENTS } from "@/lib/notifications/notification-triggers"

interface NotificationRule {
  id: string
  name: string
  trigger_event: string
  is_active: boolean
  target_roles: string[]
  channels: string[]
  title_template: string
  message_template: string
  conditions: any
  created_at: string
  updated_at: string
}

export function NotificationTriggersManagementFixed() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching notification rules...")

      const { data, error } = await supabase
        .from("notification_rules")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching notification rules:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar regras de notificação: " + error.message,
          variant: "destructive",
        })
        return
      }

      console.log("✅ Rules fetched:", data?.length || 0)
      setRules(data || [])
    } catch (err) {
      console.error("❌ Exception fetching rules:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar regras",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRule = async (ruleData: Omit<NotificationRule, "id" | "created_at" | "updated_at">) => {
    try {
      setSaving(true)
      console.log("💾 Saving notification rule...")

      const dataToSave = {
        ...ruleData,
        updated_at: new Date().toISOString(),
      }

      let error

      if (editingRule) {
        // Atualizar regra existente
        const { error: updateError } = await supabase
          .from("notification_rules")
          .update(dataToSave)
          .eq("id", editingRule.id)
        error = updateError
      } else {
        // Criar nova regra
        const { error: insertError } = await supabase.from("notification_rules").insert([dataToSave])
        error = insertError
      }

      if (error) {
        console.error("❌ Error saving rule:", error)
        toast({
          title: "Erro",
          description: "Erro ao salvar regra: " + error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: `Regra ${editingRule ? "atualizada" : "criada"} com sucesso`,
      })

      // Close dialog and refresh
      setIsDialogOpen(false)
      setEditingRule(null)
      fetchRules()
    } catch (err) {
      console.error("❌ Exception saving rule:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar regra",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule)
    setIsDialogOpen(true)
  }

  const handleNewRule = () => {
    setEditingRule(null)
    setIsDialogOpen(true)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta regra?")) return

    try {
      const { error } = await supabase.from("notification_rules").delete().eq("id", ruleId)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao eliminar regra: " + error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Regra eliminada com sucesso",
      })

      fetchRules()
    } catch (err) {
      console.error("❌ Error deleting rule:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao eliminar regra",
        variant: "destructive",
      })
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("notification_rules")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ruleId)

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar regra: " + error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: `Regra ${isActive ? "ativada" : "desativada"} com sucesso`,
      })

      fetchRules()
    } catch (err) {
      console.error("❌ Error toggling rule:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar regra",
        variant: "destructive",
      })
    }
  }

  const getEventLabel = (event: string) => {
    return AVAILABLE_TRIGGERS.find((e) => e.value === event)?.label || event
  }

  const getRoleLabel = (role: string) => {
    return AVAILABLE_RECIPIENTS.find((r) => r.value === role)?.label || role
  }

  const getChannelIcon = (channel: string) => {
    return AVAILABLE_CHANNELS.find((c) => c.value === channel)?.icon || "📱"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Carregando regras de notificação...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Notificações Automáticas</h2>
          <p className="text-gray-600">Configure gatilhos automáticos para notificações da plataforma</p>
        </div>
        <Button onClick={handleNewRule}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Regras</p>
                <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
              </div>
              <Settings className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regras Ativas</p>
                <p className="text-2xl font-bold text-green-600">{rules.filter((r) => r.is_active).length}</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regras Inativas</p>
                <p className="text-2xl font-bold text-red-600">{rules.filter((r) => !r.is_active).length}</p>
              </div>
              <Bell className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eventos Únicos</p>
                <p className="text-2xl font-bold text-blue-600">{new Set(rules.map((r) => r.trigger_event)).size}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de regras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Regras de Notificação Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma regra de notificação configurada. Clique em "Nova Regra" para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`border-l-4 ${rule.is_active ? "border-l-green-500" : "border-l-gray-400"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{rule.name}</h3>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>
                              <strong>Evento:</strong> {getEventLabel(rule.trigger_event)}
                            </span>
                            <span>
                              <strong>Destinatários:</strong> {rule.target_roles.map(getRoleLabel).join(", ")}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              <strong>Canais:</strong>
                            </span>
                            {rule.channels.map((channel) => (
                              <span key={channel} className="text-sm">
                                {getChannelIcon(channel)}
                              </span>
                            ))}
                          </div>

                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <div>
                              <strong>Título:</strong> {rule.title_template}
                            </div>
                            <div className="mt-1">
                              <strong>Mensagem:</strong> {rule.message_template}
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            Criada em: {new Date(rule.created_at).toLocaleString("pt-PT")}
                            {rule.updated_at !== rule.created_at && (
                              <span> • Atualizada em: {new Date(rule.updated_at).toLocaleString("pt-PT")}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleEditRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar regra */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra de Notificação" : "Nova Regra de Notificação"}</DialogTitle>
          </DialogHeader>
          <NotificationRuleEditor
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => setIsDialogOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
