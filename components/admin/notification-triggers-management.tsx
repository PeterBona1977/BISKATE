"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Plus, Edit, Trash2, Settings, MessageSquare, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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

const TRIGGER_EVENTS = [
  { value: "gig_created", label: "Novo Gig Criado", description: "Quando um utilizador cria um novo gig" },
  { value: "gig_approved", label: "Gig Aprovado", description: "Quando um admin aprova um gig" },
  { value: "gig_rejected", label: "Gig Rejeitado", description: "Quando um admin rejeita um gig" },
  { value: "response_received", label: "Resposta Recebida", description: "Quando um gig recebe uma nova resposta" },
  { value: "contact_viewed", label: "Contacto Visualizado", description: "Quando alguém visualiza um contacto" },
  {
    value: "sensitive_content_detected",
    label: "Conteúdo Sensível Detectado",
    description: "Quando é detectado conteúdo sensível",
  },
  { value: "user_registered", label: "Novo Utilizador", description: "Quando um novo utilizador se regista" },
  { value: "feedback_received", label: "Feedback Recebido", description: "Quando é recebido novo feedback" },
]

const TARGET_ROLES = [
  { value: "admin", label: "Administradores", icon: "👑" },
  { value: "client", label: "Clientes", icon: "👤" },
  { value: "provider", label: "Prestadores", icon: "🔧" },
  { value: "all", label: "Todos os Utilizadores", icon: "👥" },
]

const NOTIFICATION_CHANNELS = [
  { value: "app", label: "Aplicação", icon: "📱", description: "Notificação dentro da app" },
  { value: "email", label: "Email", icon: "📧", description: "Envio por email" },
  { value: "sms", label: "SMS", icon: "💬", description: "Envio por SMS (futuro)" },
]

const TEMPLATE_VARIABLES = [
  { var: "{gig_title}", desc: "Título do gig" },
  { var: "{user_name}", desc: "Nome do utilizador" },
  { var: "{platform_name}", desc: "Nome da plataforma" },
  { var: "{rejection_reason}", desc: "Motivo de rejeição" },
  { var: "{contact_info}", desc: "Informação de contacto" },
]

export function NotificationTriggersManagement() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    trigger_event: "",
    is_active: true,
    target_roles: [] as string[],
    channels: ["app"] as string[],
    title_template: "",
    message_template: "",
    conditions: {},
  })

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

  const handleSaveRule = async () => {
    try {
      console.log("💾 Saving notification rule...")

      if (!formData.name || !formData.trigger_event || !formData.title_template || !formData.message_template) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      const ruleData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      let error

      if (editingRule) {
        // Atualizar regra existente
        const { error: updateError } = await supabase
          .from("notification_rules")
          .update(ruleData)
          .eq("id", editingRule.id)
        error = updateError
      } else {
        // Criar nova regra
        const { error: insertError } = await supabase.from("notification_rules").insert([ruleData])
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

      // Reset form and close dialog
      setFormData({
        name: "",
        trigger_event: "",
        is_active: true,
        target_roles: [],
        channels: ["app"],
        title_template: "",
        message_template: "",
        conditions: {},
      })
      setEditingRule(null)
      setIsDialogOpen(false)

      // Refresh rules
      fetchRules()
    } catch (err) {
      console.error("❌ Exception saving rule:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar regra",
        variant: "destructive",
      })
    }
  }

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      trigger_event: rule.trigger_event,
      is_active: rule.is_active,
      target_roles: rule.target_roles,
      channels: rule.channels,
      title_template: rule.title_template,
      message_template: rule.message_template,
      conditions: rule.conditions || {},
    })
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
    }
  }

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("notification_rules")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
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
    }
  }

  const getEventLabel = (event: string) => {
    return TRIGGER_EVENTS.find((e) => e.value === event)?.label || event
  }

  const getRoleLabel = (role: string) => {
    return TARGET_ROLES.find((r) => r.value === role)?.label || role
  }

  const getChannelIcon = (channel: string) => {
    return NOTIFICATION_CHANNELS.find((c) => c.value === channel)?.icon || "📱"
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingRule(null)
                setFormData({
                  name: "",
                  trigger_event: "",
                  is_active: true,
                  target_roles: [],
                  channels: ["app"],
                  title_template: "",
                  message_template: "",
                  conditions: {},
                })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Notificação"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Regra *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Notificar admin sobre novo gig"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Evento Gatilho *</label>
                  <Select
                    value={formData.trigger_event}
                    onValueChange={(value) => setFormData({ ...formData, trigger_event: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_EVENTS.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          <div>
                            <div className="font-medium">{event.label}</div>
                            <div className="text-sm text-gray-500">{event.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Destinatários */}
              <div>
                <label className="block text-sm font-medium mb-2">Destinatários *</label>
                <div className="grid gap-2 md:grid-cols-2">
                  {TARGET_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role.value}`}
                        checked={formData.target_roles.includes(role.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, target_roles: [...formData.target_roles, role.value] })
                          } else {
                            setFormData({
                              ...formData,
                              target_roles: formData.target_roles.filter((r) => r !== role.value),
                            })
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`role-${role.value}`} className="text-sm">
                        {role.icon} {role.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Canais */}
              <div>
                <label className="block text-sm font-medium mb-2">Canais de Entrega *</label>
                <div className="grid gap-2 md:grid-cols-3">
                  {NOTIFICATION_CHANNELS.map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`channel-${channel.value}`}
                        checked={formData.channels.includes(channel.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, channels: [...formData.channels, channel.value] })
                          } else {
                            setFormData({ ...formData, channels: formData.channels.filter((c) => c !== channel.value) })
                          }
                        }}
                        className="rounded border-gray-300"
                        disabled={channel.value === "sms"} // SMS ainda não implementado
                      />
                      <label htmlFor={`channel-${channel.value}`} className="text-sm">
                        {channel.icon} {channel.label}
                        {channel.value === "sms" && <span className="text-gray-400"> (Em breve)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título da Notificação *</label>
                  <Input
                    value={formData.title_template}
                    onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                    placeholder="Ex: Novo Gig Criado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mensagem da Notificação *</label>
                  <Textarea
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    placeholder="Ex: Um novo gig '{gig_title}' foi criado por {user_name}"
                    rows={3}
                  />
                </div>

                {/* Variáveis disponíveis */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Variáveis Disponíveis:</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {TEMPLATE_VARIABLES.map((variable) => (
                      <div key={variable.var} className="text-sm">
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{variable.var}</code>
                        <span className="text-blue-700 ml-2">{variable.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Regra ativa</label>
              </div>

              {/* Ações */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveRule}>{editingRule ? "Atualizar" : "Criar"} Regra</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <Bell className="h-4 w-4" />
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
    </div>
  )
}
