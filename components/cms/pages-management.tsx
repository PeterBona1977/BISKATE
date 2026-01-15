"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Eye, Clock, FileText, History } from "lucide-react"

interface CMSPage {
  id: string
  title: string
  slug: string
  content: string | null
  meta_title: string | null
  meta_description: string | null
  status: "draft" | "published" | "scheduled" | "archived"
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

interface PageVersion {
  id: string
  version_number: number
  title: string
  content: string | null
  created_at: string
}

export function PagesManagement() {
  const [pages, setPages] = useState<CMSPage[]>([])
  const [versions, setVersions] = useState<PageVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null)
  const [showVersions, setShowVersions] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("cms_pages").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setPages(data || [])
    } catch (err) {
      console.error("❌ Erro ao carregar páginas:", err)
      toast({
        title: "Erro",
        description: "Erro ao carregar páginas do CMS",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from("cms_page_versions")
        .select("*")
        .eq("page_id", pageId)
        .order("version_number", { ascending: false })

      if (error) throw error
      setVersions(data || [])
    } catch (err) {
      console.error("❌ Erro ao carregar versões:", err)
      toast({
        title: "Erro",
        description: "Erro ao carregar versões da página",
        variant: "destructive",
      })
    }
  }

  const savePage = async (pageData: Partial<CMSPage>) => {
    try {
      const isEditing = !!editingPage

      if (isEditing) {
        // Criar versão antes de atualizar
        await supabase.from("cms_page_versions").insert({
          page_id: editingPage.id,
          version_number: await getNextVersionNumber(editingPage.id),
          title: editingPage.title,
          content: editingPage.content,
          meta_title: editingPage.meta_title,
          meta_description: editingPage.meta_description,
        })

        // Atualizar página
        const { error } = await supabase
          .from("cms_pages")
          .update({
            ...pageData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPage.id)

        if (error) throw error
      } else {
        // Criar nova página
        const { error } = await supabase.from("cms_pages").insert({
          ...pageData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: `Página ${isEditing ? "atualizada" : "criada"} com sucesso!`,
      })

      setIsDialogOpen(false)
      setEditingPage(null)
      fetchPages()
    } catch (err) {
      console.error("❌ Erro ao salvar página:", err)
      toast({
        title: "Erro",
        description: "Erro ao salvar página",
        variant: "destructive",
      })
    }
  }

  const getNextVersionNumber = async (pageId: string): Promise<number> => {
    const { data } = await supabase
      .from("cms_page_versions")
      .select("version_number")
      .eq("page_id", pageId)
      .order("version_number", { ascending: false })
      .limit(1)

    return (data?.[0]?.version_number || 0) + 1
  }

  const deletePage = async (pageId: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta página?")) return

    try {
      const { error } = await supabase.from("cms_pages").delete().eq("id", pageId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Página eliminada com sucesso!",
      })

      fetchPages()
    } catch (err) {
      console.error("❌ Erro ao eliminar página:", err)
      toast({
        title: "Erro",
        description: "Erro ao eliminar página",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      published: "default",
      scheduled: "outline",
      archived: "destructive",
    } as const

    const labels = {
      draft: "Rascunho",
      published: "Publicado",
      scheduled: "Agendado",
      archived: "Arquivado",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Páginas</h2>
          <p className="text-gray-600">Crie e gira páginas estáticas do site</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPage(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Página
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPage ? "Editar Página" : "Nova Página"}</DialogTitle>
            </DialogHeader>
            <PageForm
              page={editingPage}
              onSave={savePage}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingPage(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Páginas */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando páginas...</p>
          </div>
        ) : pages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma página encontrada</h3>
              <p className="text-gray-600 mb-4">Comece criando a sua primeira página estática.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Página
              </Button>
            </CardContent>
          </Card>
        ) : (
          pages.map((page) => (
            <Card key={page.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium">{page.title}</h3>
                      {getStatusBadge(page.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>URL:</strong> /{page.slug}
                    </p>
                    {page.meta_description && <p className="text-sm text-gray-600 mb-2">{page.meta_description}</p>}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Criado: {new Date(page.created_at).toLocaleDateString("pt-PT")}</span>
                      {page.published_at && (
                        <span>Publicado: {new Date(page.published_at).toLocaleDateString("pt-PT")}</span>
                      )}
                      {page.scheduled_at && (
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Agendado: {new Date(page.scheduled_at).toLocaleDateString("pt-PT")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowVersions(page.id)
                        fetchVersions(page.id)
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`/${page.slug}`, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPage(page)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deletePage(page.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Versões */}
      {showVersions && (
        <Dialog open={!!showVersions} onOpenChange={() => setShowVersions(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de Versões</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {versions.map((version) => (
                <Card key={version.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Versão {version.version_number}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(version.created_at).toLocaleString("pt-PT")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{version.title}</p>
                    {version.content && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded max-h-20 overflow-hidden">
                        {version.content.substring(0, 200)}...
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Componente do formulário de página
function PageForm({
  page,
  onSave,
  onCancel,
}: {
  page: CMSPage | null
  onSave: (data: Partial<CMSPage>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: page?.title || "",
    slug: page?.slug || "",
    content: page?.content || "",
    meta_title: page?.meta_title || "",
    meta_description: page?.meta_description || "",
    status: page?.status || "draft",
    scheduled_at: page?.scheduled_at || "",
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const saveData: Partial<CMSPage> = {
      ...formData,
      published_at: formData.status === "published" ? new Date().toISOString() : null,
      scheduled_at: formData.scheduled_at || null,
    }

    onSave(saveData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título da página"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">URL (Slug)</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="url-da-pagina"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Conteúdo</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Conteúdo da página (HTML permitido)"
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Meta Título</label>
            <Input
              value={formData.meta_title}
              onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
              placeholder="Título para SEO (60 caracteres)"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Meta Descrição</label>
            <Textarea
              value={formData.meta_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
              placeholder="Descrição para SEO (160 caracteres)"
              maxLength={160}
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === "scheduled" && (
            <div>
              <label className="block text-sm font-medium mb-2">Data de Publicação</label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{page ? "Atualizar" : "Criar"} Página</Button>
      </div>
    </form>
  )
}
