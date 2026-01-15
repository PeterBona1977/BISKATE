"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Layout, Eye, EyeOff } from "lucide-react"

interface CMSSection {
  id: string
  section_key: string
  title: string
  content: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export function SectionsManagement() {
  const [sections, setSections] = useState<CMSSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<CMSSection | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("cms_sections").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setSections(data || [])
    } catch (err) {
      console.error("❌ Erro ao carregar secções:", err)
      toast({
        title: "Erro",
        description: "Erro ao carregar secções do CMS",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (sectionData: Partial<CMSSection>) => {
    try {
      const isEditing = !!editingSection

      if (isEditing) {
        const { error } = await supabase
          .from("cms_sections")
          .update({
            ...sectionData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSection.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("cms_sections").insert({
          ...sectionData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: `Secção ${isEditing ? "atualizada" : "criada"} com sucesso!`,
      })

      setIsDialogOpen(false)
      setEditingSection(null)
      fetchSections()
    } catch (err) {
      console.error("❌ Erro ao salvar secção:", err)
      toast({
        title: "Erro",
        description: "Erro ao salvar secção",
        variant: "destructive",
      })
    }
  }

  const toggleSection = async (sectionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("cms_sections")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sectionId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Secção ${isActive ? "ativada" : "desativada"} com sucesso!`,
      })

      fetchSections()
    } catch (err) {
      console.error("❌ Erro ao alterar status da secção:", err)
      toast({
        title: "Erro",
        description: "Erro ao alterar status da secção",
        variant: "destructive",
      })
    }
  }

  const deleteSection = async (sectionId: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta secção?")) return

    try {
      const { error } = await supabase.from("cms_sections").delete().eq("id", sectionId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Secção eliminada com sucesso!",
      })

      fetchSections()
    } catch (err) {
      console.error("❌ Erro ao eliminar secção:", err)
      toast({
        title: "Erro",
        description: "Erro ao eliminar secção",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Secções</h2>
          <p className="text-gray-600">Gira conteúdo dinâmico das secções do site</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSection(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Secção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSection ? "Editar Secção" : "Nova Secção"}</DialogTitle>
            </DialogHeader>
            <SectionForm
              section={editingSection}
              onSave={saveSection}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingSection(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Secções */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando secções...</p>
          </div>
        ) : sections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Layout className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma secção encontrada</h3>
              <p className="text-gray-600 mb-4">Comece criando a sua primeira secção dinâmica.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Secção
              </Button>
            </CardContent>
          </Card>
        ) : (
          sections.map((section) => (
            <Card key={section.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        {section.is_active ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${section.is_active ? "text-green-600" : "text-gray-400"}`}>
                          {section.is_active ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Chave:</strong> {section.section_key}
                    </p>
                    <div className="text-xs text-gray-500">
                      Atualizado: {new Date(section.updated_at).toLocaleString("pt-PT")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={section.is_active}
                      onCheckedChange={(checked) => toggleSection(section.id, checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSection(section)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteSection(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview do conteúdo */}
                {section.content && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Preview do Conteúdo:</h4>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(section.content, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// Componente do formulário de secção
function SectionForm({
  section,
  onSave,
  onCancel,
}: {
  section: CMSSection | null
  onSave: (data: Partial<CMSSection>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: section?.title || "",
    section_key: section?.section_key || "",
    content: section?.content ? JSON.stringify(section.content, null, 2) : "",
    is_active: section?.is_active ?? true,
  })

  const generateKey = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      section_key: prev.section_key || generateKey(title),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const content = formData.content ? JSON.parse(formData.content) : null

      onSave({
        title: formData.title,
        section_key: formData.section_key,
        content,
        is_active: formData.is_active,
      })
    } catch (err) {
      alert("Erro no formato JSON do conteúdo. Verifique a sintaxe.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Título</label>
        <Input
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Título da secção"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Chave da Secção</label>
        <Input
          value={formData.section_key}
          onChange={(e) => setFormData((prev) => ({ ...prev, section_key: e.target.value }))}
          placeholder="chave_da_seccao"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Identificador único para esta secção (usado no código)</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Conteúdo (JSON)</label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder='{"title": "Título", "description": "Descrição"}'
          rows={8}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">Formato JSON para estruturar o conteúdo da secção</p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
        <label className="text-sm font-medium">Secção ativa</label>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{section ? "Atualizar" : "Criar"} Secção</Button>
      </div>
    </form>
  )
}
