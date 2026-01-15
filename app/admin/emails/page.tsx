"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { Mail, Plus, Search, Edit, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface EmailTemplate {
    id: string
    name: string
    slug: string
    category: string
    subject: string
    body: string
    trigger_key?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export default function EmailTemplatesPage() {
    const router = useRouter()
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("email_templates")
                .select("*")
                .order("category", { ascending: true })
                .order("name", { ascending: true })

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error("Error loading templates:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredTemplates = templates.filter(
        (t) =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            welcome: "bg-blue-100 text-blue-800",
            verification: "bg-green-100 text-green-800",
            notification: "bg-yellow-100 text-yellow-800",
            transactional: "bg-purple-100 text-purple-800",
            marketing: "bg-pink-100 text-pink-800",
        }
        return colors[category] || "bg-gray-100 text-gray-800"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">A carregar templates...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
                    <p className="text-gray-600 mt-2">Gerir templates de email do sistema</p>
                </div>
                <Button onClick={() => router.push("/admin/emails/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Pesquisar templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <CardDescription className="mt-1">{template.subject}</CardDescription>
                                </div>
                                <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{template.slug}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {template.trigger_key && (
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                            {template.trigger_key}
                                        </Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/admin/emails/${template.id}`)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/admin/emails/${template.id}/preview`)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Badge variant={template.is_active ? "default" : "secondary"}>
                                    {template.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum template encontrado</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
