"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client-fixed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, FolderTree, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  margin_percentage: number
  is_active: boolean
  slug: string
  icon: string | null
  featured: boolean
  created_at: string
  subcategories?: Category[]
}

export function CategoriesManagementFixed() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
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

      const { data, error, count } = await supabase.from("categories").select("*", { count: "exact" }).order("name")

      console.log("📋 Resultado:", { data, error, count })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        setError("Nenhuma categoria encontrada. Execute o script de reset primeiro.")
        setCategories([])
        return
      }

      // Organizar hierarquia
      const categoriesMap = new Map()
      const rootCategories: Category[] = []

      data.forEach((category: Category) => {
        categoriesMap.set(category.id, { ...category, subcategories: [] })
      })

      data.forEach((category: Category) => {
        if (category.parent_id) {
          const parent = categoriesMap.get(category.parent_id)
          if (parent) {
            parent.subcategories.push(categoriesMap.get(category.id))
          }
        } else {
          rootCategories.push(categoriesMap.get(category.id))
        }
      })

      setCategories(rootCategories)
      console.log("✅ Categorias carregadas:", rootCategories.length)
    } catch (error: any) {
      console.error("💥 Erro:", error)
      setError(`Erro: ${error.message}`)
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
        parent_id: formData.parent_id || null,
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
      parent_id: category.parent_id || "",
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
      parent_id: "",
      margin_percentage: 10,
      is_active: true,
      slug: "",
      icon: "",
      featured: false,
    })
    setEditingCategory(null)
  }

  const renderCategoryCard = (category: Category, level = 0) => (
    <div key={category.id} className={`${level > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""}`}>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {category.icon || category.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  {category.featured && <Badge variant="secondary">Destaque</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">Margem: {category.margin_percentage}%</Badge>
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <Badge variant="outline">{category.subcategories?.length || 0} subcategorias</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(category.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {category.subcategories?.map((sub) => renderCategoryCard(sub, level + 1))}
    </div>
  )

  const getAllCategories = (cats: Category[]): Category[] => {
    const result: Category[] = []
    cats.forEach((cat) => {
      result.push(cat)
      if (cat.subcategories) {
        result.push(...getAllCategories(cat.subcategories))
      }
    })
    return result
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Categorias (Versão Corrigida)</h1>
          <p className="text-muted-foreground">Sistema de categorias com correções aplicadas</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recarregar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="categoria-exemplo"
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Categoria Pai</label>
                    <Select
                      value={formData.parent_id}
                      onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Categoria principal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Categoria principal</SelectItem>
                        {getAllCategories(categories)
                          .filter((cat) => !cat.parent_id && cat.id !== editingCategory?.id)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ícone</label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="💻"
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

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Problema:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderTree className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{getAllCategories(categories).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderTree className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{getAllCategories(categories).filter((c) => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderTree className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Principais</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderTree className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Em Destaque</p>
                <p className="text-2xl font-bold">{getAllCategories(categories).filter((c) => c.featured).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderTree className="h-5 w-5 mr-2" />
            Categorias (Versão Corrigida)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Carregando categorias...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Erro ao carregar categorias.</p>
              <Button variant="outline" onClick={fetchCategories}>
                Tentar novamente
              </Button>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
              <p className="text-sm text-muted-foreground mt-2">Execute o script de reset primeiro.</p>
            </div>
          ) : (
            <div className="space-y-4">{categories.map((category) => renderCategoryCard(category))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
