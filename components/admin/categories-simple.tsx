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
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  description: string | null
  margin_percentage: number
  is_active: boolean
  slug: string
  icon: string | null
  featured: boolean
  created_at: string
}

export function CategoriesSimple() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    margin_percentage: 10,
    is_active: true,
    slug: "",
    icon: "",
    featured: false,
  })

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔍 Buscando categorias...")

      // Teste de conexão primeiro
      const { data: testData, error: testError } = await supabase
        .from("categories")
        .select("count", { count: "exact", head: true })

      console.log("📊 Teste de conexão:", { testData, testError })

      if (testError) {
        throw new Error(`Erro de conexão: ${testError.message}`)
      }

      // Buscar categorias
      const { data, error } = await supabase.from("categories").select("*").order("name")

      console.log("📋 Resultado da query:", { data, error, count: data?.length })

      if (error) {
        throw new Error(`Erro na query: ${error.message}`)
      }

      if (!data || data.length === 0) {
        setError("⚠️ Nenhuma categoria encontrada. Execute o script SQL primeiro.")
        setCategories([])
        return
      }

      setCategories(data)
      console.log("✅ Categorias carregadas:", data.length)
    } catch (error: any) {
      console.error("💥 Erro:", error)
      setError(error.message)
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const slug = formData.slug || generateSlug(formData.name)
      const categoryData = {
        name: formData.name,
        description: formData.description || null,
        margin_percentage: formData.margin_percentage,
        is_active: formData.is_active,
        slug,
        icon: formData.icon || null,
        featured: formData.featured,
        updated_at: new Date().toISOString(),
      }

      if (editingCategory) {
        const { error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id)

        if (error) throw error

        toast({
          title: "Categoria atualizada",
          description: "A categoria foi atualizada com sucesso.",
        })
      } else {
        const { error } = await supabase.from("categories").insert([categoryData])

        if (error) throw error

        toast({
          title: "Categoria criada",
          description: "A categoria foi criada com sucesso.",
        })
      }

      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      console.error("💥 Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      margin_percentage: category.margin_percentage,
      is_active: category.is_active,
      slug: category.slug,
      icon: category.icon || "",
      featured: category.featured || false,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId)

      if (error) throw error

      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      })

      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      margin_percentage: 10,
      is_active: true,
      slug: "",
      icon: "",
      featured: false,
    })
    setEditingCategory(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Categorias (Versão Simples)</h1>
          <p className="text-muted-foreground">Sistema simplificado e funcional</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />🔄 Recarregar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        const newName = e.target.value
                        setFormData({
                          ...formData,
                          name: newName,
                          slug: formData.slug || generateSlug(newName),
                        })
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ícone</label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="💻"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="categoria-exemplo"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Margem (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.margin_percentage}
                      onChange={(e) =>
                        setFormData({ ...formData, margin_percentage: Number.parseFloat(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <label className="text-sm font-medium">Ativa</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                    <label className="text-sm font-medium">Destaque</label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : editingCategory ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div>
                <p className="font-medium">Total de Categorias</p>
                <p className="text-sm text-muted-foreground">
                  {categories.filter((c) => c.is_active).length} ativas, {categories.filter((c) => c.featured).length}{" "}
                  em destaque
                </p>
              </div>
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Carregando categorias...</p>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Erro ao carregar categorias.</p>
            <Button variant="outline" onClick={fetchCategories}>
              Tentar novamente
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
            <p className="text-sm text-muted-foreground mt-2">Execute o script SQL primeiro.</p>
          </div>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                      {category.icon || category.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">{category.slug}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {category.description || "Sem descrição"}
                </p>

                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{category.margin_percentage}%</Badge>
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  {category.featured && <Badge variant="secondary">Destaque</Badge>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
