"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Save, X, Info, Zap, Eye, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AVAILABLE_TRIGGERS, AVAILABLE_CHANNELS, AVAILABLE_RECIPIENTS } from "@/lib/notifications/notification-triggers"

interface NotificationRule {
  id?: string
  name: string
  trigger_event: string
  is_active: boolean
  target_roles: string[]
  channels: string[]
  title_template: string
  message_template: string
  conditions: any
}

interface NotificationRuleEditorProps {
  rule?: NotificationRule | null
  onSave: (rule: NotificationRule) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function NotificationRuleEditor({ rule, onSave, onCancel, loading = false }: NotificationRuleEditorProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<NotificationRule>({
    name: "",
    trigger_event: "",
    is_active: true,
    target_roles: [],
    channels: ["app"],
    title_template: "",
    message_template: "",
    conditions: {},
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewMode, setPreviewMode] = useState(false)
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null)

  useEffect(() => {
    if (rule) {
      setFormData(rule)
    } else {
      // Reset form for new rule
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
    }
    setErrors({})
  }, [rule])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome da regra é obrigatório"
    }

    if (!formData.trigger_event) {
      newErrors.trigger_event = "Gatilho é obrigatório"
    }

    if (formData.target_roles.length === 0) {
      newErrors.target_roles = "Pelo menos um destinatário deve ser selecionado"
    }

    if (formData.channels.length === 0) {
      newErrors.channels = "Pelo menos um canal deve ser selecionado"
    }

    if (!formData.title_template.trim()) {
      newErrors.title_template = "Título da notificação é obrigatório"
    }

    if (!formData.message_template.trim()) {
      newErrors.message_template = "Mensagem da notificação é obrigatória"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      })
      return
    }

    try {
      await onSave(formData)
    } catch (error) {
      console.error("Error saving rule:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar regra de notificação",
        variant: "destructive",
      })
    }
  }

  const getSelectedTrigger = () => {
    return AVAILABLE_TRIGGERS.find((t) => t.value === formData.trigger_event)
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable)
    setCopiedVariable(variable)
    setTimeout(() => setCopiedVariable(null), 2000)
    toast({
      title: "Copiado!",
      description: `Variável ${variable} copiada para a área de transferência`,
    })
  }

  const getPreviewContent = () => {
    const trigger = getSelectedTrigger()
    if (!trigger) return { title: "", message: "" }

    let title = formData.title_template
    let message = formData.message_template

    // Replace variables with example values
    const exampleValues: Record<string, string> = {
      "{gig_title}": "Limpeza de Casa",
      "{user_name}": "João Silva",
      "{platform_name}": "BISKATE",
      "{rejection_reason}": "Informação insuficiente",
      "{user_email}": "joao@exemplo.com",
      "{content_type}": "gig",
      "{detected_patterns}": "telefone, email",
      "{category}": "sugestão",
      "{subject}": "Melhorar interface",
      "{attempt_count}": "5",
      "{ip_address}": "192.168.1.1",
      "{credits_used}": "1",
      "{client_name}": "Maria Santos",
      "{provider_name}": "Pedro Costa",
    }

    Object.entries(exampleValues).forEach(([key, value]) => {
      title = title.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value)
      message = message.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value)
    })

    return { title, message }
  }

  const selectedTrigger = getSelectedTrigger()
  const previewContent = getPreviewContent()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {rule ? "Editar Regra de Notificação" : "Nova Regra de Notificação"}
          </h3>
          <p className="text-sm text-gray-600">Configure quando e como as notificações serão enviadas</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Editar" : "Preview"}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Preview da Notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900">{previewContent.title || "Título da notificação"}</h4>
                  <p className="text-blue-800 mt-1">{previewContent.message || "Mensagem da notificação"}</p>
                  <div className="flex items-center space-x-4 mt-3 text-xs text-blue-600">
                    <span>📱 App</span>
                    {formData.channels.includes("email") && <span>📧 Email</span>}
                    {formData.channels.includes("sms") && <span>💬 SMS</span>}
                    {formData.channels.includes("push") && <span>🔔 Push</span>}
                  </div>
                </div>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Este é um exemplo de como a notificação aparecerá para os utilizadores. As variáveis serão substituídas
                pelos valores reais no momento do envio.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Configuração Básica</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Regra *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Notificar admin sobre novo gig"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gatilho (Evento) *</label>
                  <Select
                    value={formData.trigger_event}
                    onValueChange={(value) => setFormData({ ...formData, trigger_event: value })}
                  >
                    <SelectTrigger className={errors.trigger_event ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione um evento gatilho" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_TRIGGERS.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <div>
                            <div className="font-medium">{trigger.label}</div>
                            <div className="text-sm text-gray-500">{trigger.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.trigger_event && <p className="text-red-500 text-xs mt-1">{errors.trigger_event}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label className="text-sm font-medium">Regra ativa</label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Destinatários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {AVAILABLE_RECIPIENTS.map((recipient) => (
                    <div key={recipient.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`recipient-${recipient.value}`}
                        checked={formData.target_roles.includes(recipient.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              target_roles: [...formData.target_roles, recipient.value],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              target_roles: formData.target_roles.filter((r) => r !== recipient.value),
                            })
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`recipient-${recipient.value}`} className="text-sm cursor-pointer">
                        <span className="mr-2">{recipient.icon}</span>
                        {recipient.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.target_roles && <p className="text-red-500 text-xs mt-2">{errors.target_roles}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Canais de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {AVAILABLE_CHANNELS.map((channel) => (
                    <div key={channel.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`channel-${channel.value}`}
                        checked={formData.channels.includes(channel.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              channels: [...formData.channels, channel.value],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              channels: formData.channels.filter((c) => c !== channel.value),
                            })
                          }
                        }}
                        className="rounded border-gray-300"
                        disabled={!channel.enabled}
                      />
                      <label htmlFor={`channel-${channel.value}`} className="text-sm cursor-pointer">
                        <span className="mr-2">{channel.icon}</span>
                        {channel.label}
                        {!channel.enabled && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Em breve
                          </Badge>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.channels && <p className="text-red-500 text-xs mt-2">{errors.channels}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo da Notificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título da Notificação *</label>
                  <Input
                    value={formData.title_template}
                    onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                    placeholder="Ex: Novo Gig Criado"
                    className={errors.title_template ? "border-red-500" : ""}
                  />
                  {errors.title_template && <p className="text-red-500 text-xs mt-1">{errors.title_template}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mensagem da Notificação *</label>
                  <Textarea
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    placeholder="Ex: Um novo gig '{gig_title}' foi criado por {user_name}"
                    rows={4}
                    className={errors.message_template ? "border-red-500" : ""}
                  />
                  {errors.message_template && <p className="text-red-500 text-xs mt-1">{errors.message_template}</p>}
                </div>

                {selectedTrigger && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Variáveis Disponíveis para "{selectedTrigger.label}"
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {selectedTrigger.variables.map((variable) => (
                        <div key={variable} className="flex items-center justify-between bg-white p-2 rounded border">
                          <code className="text-sm text-blue-800">{variable}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyVariable(variable)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedVariable === variable ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Clique para copiar uma variável e cole no título ou mensagem
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Configurações avançadas como condições específicas e filtros serão implementadas em versões futuras.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Salvando..." : rule ? "Atualizar Regra" : "Criar Regra"}
        </Button>
      </div>
    </div>
  )
}
