"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase/client"
import { ArrowLeft, Save, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AVAILABLE_TRIGGERS } from "@/lib/notifications/trigger-constants"

interface EmailTemplate {
    id?: string
    name: string
    slug: string
    category: string
    trigger_key?: string
    subject: string
    body: string
    variables: string[]
    is_active: boolean
}

export default function EmailTemplateEditorPage() {
    const params = useParams()
    const router = useRouter()
    const isNew = params.id === "new"

    const [template, setTemplate] = useState<EmailTemplate>({
        name: "",
        slug: "",
        category: "notification",
        trigger_key: "",
        subject: "",
        body: "",
        variables: [],
        is_active: true,
    })
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isNew && params.id) {
            loadTemplate(params.id as string)
        }
    }, [params.id, isNew])

    const loadTemplate = async (id: string) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("email_templates")
                .select("*")
                .eq("id", id)
                .single()

            if (error) throw error
            if (data) {
                setTemplate({
                    ...data,
                    variables: Array.isArray(data.variables) ? data.variables : [],
                })
            }
        } catch (error) {
            console.error("Error loading template:", error)
            router.push("/admin/emails")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const templateData = {
                name: template.name,
                slug: template.slug,
                category: template.category,
                trigger_key: template.trigger_key || null,
                subject: template.subject,
                body: template.body,
                variables: template.variables,
                is_active: template.is_active,
                updated_at: new Date().toISOString(),
            }

            if (isNew) {
                const { error } = await supabase
                    .from("email_templates")
                    .insert([templateData])

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from("email_templates")
                    .update(templateData)
                    .eq("id", params.id)

                if (error) throw error
            }

            router.push("/admin/emails")
        } catch (error) {
            console.error("Error saving template:", error)
            alert("Erro ao guardar template")
        } finally {
            setSaving(false)
        }
    }

    const extractVariables = () => {
        const regex = /\{\{(\w+)\}\}/g
        const matches = template.body.match(regex) || []
        const vars = matches.map((m) => m.replace(/\{\{|\}\}/g, ""))
        setTemplate({ ...template, variables: [...new Set(vars)] })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">A carregar...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => router.push("/admin/emails")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isNew ? "Novo Template" : "Editar Template"}
                        </h1>
                        <p className="text-gray-600 mt-1">{template.name || "Template de email"}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nome do Template</Label>
                                <Input
                                    id="name"
                                    value={template.name}
                                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                                    placeholder="Ex: Welcome Email"
                                />
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug (identificador único)</Label>
                                <Input
                                    id="slug"
                                    value={template.slug}
                                    onChange={(e) => setTemplate({ ...template, slug: e.target.value })}
                                    placeholder="Ex: welcome-email"
                                />
                            </div>

                            <div>
                                <Label htmlFor="category">Categoria</Label>
                                <Select
                                    value={template.category}
                                    onValueChange={(value) => setTemplate({ ...template, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="welcome">Welcome</SelectItem>
                                        <SelectItem value="verification">Verification</SelectItem>
                                        <SelectItem value="notification">Notification</SelectItem>
                                        <SelectItem value="transactional">Transactional</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="trigger_key">Gatilho do Sistema (Trigger)</Label>
                                <Select
                                    value={template.trigger_key || "none"}
                                    onValueChange={(value) => setTemplate({ ...template, trigger_key: value === "none" ? undefined : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sem gatilho" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sem gatilho automátio</SelectItem>
                                        {AVAILABLE_TRIGGERS.map((trigger) => (
                                            <SelectItem key={trigger.value} value={trigger.value}>
                                                {trigger.label} ({trigger.value})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-gray-500 mt-1">
                                    Define quando este email será enviado automaticamente pelo sistema.
                                </p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={template.is_active}
                                    onCheckedChange={(checked) => setTemplate({ ...template, is_active: checked })}
                                />
                                <Label>Template Ativo</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Conteúdo do Email</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="subject">Assunto</Label>
                                <Input
                                    id="subject"
                                    value={template.subject}
                                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                                    placeholder="Ex: Bem-vindo ao BISKATE!"
                                />
                            </div>

                            <div>
                                <Label htmlFor="body">Corpo do Email (HTML)</Label>
                                <Textarea
                                    id="body"
                                    value={template.body}
                                    onChange={(e) => setTemplate({ ...template, body: e.target.value })}
                                    onBlur={extractVariables}
                                    rows={15}
                                    className="font-mono text-sm"
                                    placeholder="<h1>Olá {{user_name}}!</h1>..."
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Use <code className="bg-gray-100 px-1 rounded">{"{{variable}}"}</code> para variáveis dinâmicas
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Variáveis Disponíveis</CardTitle>
                            <CardDescription>Variáveis detectadas no template</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {template.variables.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {template.variables.map((variable) => (
                                        <Badge key={variable} variant="secondary">
                                            {`{{${variable}}}`}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Nenhuma variável detectada</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="text-sm font-semibold mb-2">Assunto:</div>
                                <div className="text-sm mb-4">{template.subject || "Sem assunto"}</div>
                                <div className="text-sm font-semibold mb-2">Corpo:</div>
                                <div
                                    className="text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: template.body || "<p>Sem conteúdo</p>" }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
