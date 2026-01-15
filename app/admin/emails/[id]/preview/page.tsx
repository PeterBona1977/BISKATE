"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { ArrowLeft, Send, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { sendTestEmailAction } from "@/app/actions/email"
import { toast } from "sonner"

interface EmailTemplate {
    id: string
    name: string
    slug: string
    category: string
    subject: string
    body: string
    variables: string[]
    is_active: boolean
}

export default function EmailTemplatePreviewPage() {
    const params = useParams()
    const router = useRouter()
    const [template, setTemplate] = useState<EmailTemplate | null>(null)
    const [loading, setLoading] = useState(true)
    const [testEmail, setTestEmail] = useState("")
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (params.id) {
            loadTemplate(params.id as string)
        }
    }, [params.id])

    const loadTemplate = async (id: string) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("email_templates")
                .select("*")
                .eq("id", id)
                .single()

            if (error) throw error
            setTemplate(data)
        } catch (error) {
            console.error("Error loading template:", error)
            toast.error("Erro ao carregar template")
            router.push("/admin/emails")
        } finally {
            setLoading(false)
        }
    }

    const handleSendTest = async () => {
        if (!testEmail || !template) return

        try {
            setSending(true)
            const result = await sendTestEmailAction(testEmail, template.slug)

            if (result.success) {
                toast.success("Email de teste enviado com sucesso!")
            } else {
                toast.error("Erro ao enviar email: " + result.message)
            }
        } catch (error) {
            console.error("Error sending test email:", error)
            toast.error("Erro ao enviar email de teste")
        } finally {
            setSending(false)
        }
    }

    // Mock variable replacement for preview
    const getPreviewHtml = () => {
        if (!template) return ""
        let html = template.body

        // Replace common variables with placeholders
        const mockData: Record<string, string> = {
            user_name: "Pedro Silva",
            dashboard_link: "#",
            verification_link: "#",
            reset_link: "#",
            sender_name: "João Santos",
            message_preview: "Esta é uma mensagem de exemplo para pré-visualização.",
            message_link: "#",
            amount: "50.00",
            gig_title: "Desenvolvimento Web",
            payment_link: "#"
        }

        // Replace explicit variables
        if (template.variables && Array.isArray(template.variables)) {
            template.variables.forEach(v => {
                const regex = new RegExp(`{{${v}}}`, "g")
                html = html.replace(regex, mockData[v] || `[${v}]`)
            })
        }

        // Also try to replace known keys just in case variables array is empty but body has them
        Object.entries(mockData).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, "g")
            html = html.replace(regex, value)
        })

        return html
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

    if (!template) {
        return <div>Template não encontrado</div>
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
                            Pré-visualizar Template
                        </h1>
                        <p className="text-gray-600 mt-1">{template.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview Area */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Visualização</CardTitle>
                        <CardDescription>
                            Como o email aparecerá para o utilizador (com dados de exemplo)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-6 bg-white min-h-[400px]">
                            <div className="mb-4 pb-4 border-b">
                                <div className="text-sm text-gray-500">Assunto:</div>
                                <div className="font-semibold text-lg">{template.subject}</div>
                            </div>
                            <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enviar Teste</CardTitle>
                            <CardDescription>
                                Envie um email de teste para verificar a entrega
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="test-email">Email de Destino</Label>
                                <div className="mt-2 flex space-x-2">
                                    <Input
                                        id="test-email"
                                        placeholder="seu@email.com"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleSendTest}
                                disabled={sending || !testEmail}
                            >
                                {sending ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <Send className="h-4 w-4 mr-2" />
                                )}
                                Enviar Teste
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium">Slug:</span>
                                <span className="text-sm text-gray-600 font-mono">{template.slug}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium">Categoria:</span>
                                <Badge variant="outline">{template.category}</Badge>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium">Estado:</span>
                                <Badge variant={template.is_active ? "default" : "secondary"}>
                                    {template.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
