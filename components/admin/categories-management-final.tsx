"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  parent_id: string | null
  is_active: boolean
  is_featured: boolean
  requires_verification: boolean
  sort_order: number
  min_price: number | null
  max_price: number | null
  commission_rate: number | null
  created_at: string
  updated_at: string
  children?: Category[]
  gig_count?: number
}

interface CategoryStats {
  total_categories: number
  active_categories: number
  featured_categories: number
  total_gigs: number
  total_revenue: number
}

export default function CategoriesManagementFinal() {
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<CategoryStats>({
    total_categories: 0,
    active_categories: 0,
    featured_categories: 0,
    total_gigs: 0,
    total_revenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "featured">("all")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "#3B82F6",
    parent_id: "",
    is_active: true,
    is_featured: false,
    requires_verification: false,
    sort_order: 0,
    min_price: "",
    max_price: "",
    commission_rate: "",
  })

  useEffect(() => {
    loadCategories()
    loadStats()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔍 Carregando categorias...")

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })

      if (categoriesError) {
        console.error("❌ Erro ao carregar categorias:", categoriesError)
        throw categoriesError
      }

      console.log("✅ Categorias carregadas:", categoriesData?.length || 0)

      if (!categoriesData || categoriesData.length === 0) {
        setError("Nenhuma categoria encontrada. Execute o script SQL primeiro.")
        setCategories([])
        return
      }

      // Organizar em hierarquia
      const hierarchicalCategories = buildCategoryHierarchy(categoriesData)
      setCategories(hierarchicalCategories)
    } catch (error: any) {
      console.error("💥 Erro ao carregar categorias:", error)
      setError(error.message || "Erro ao carregar categorias")
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Estatísticas das categorias
      const { data: categoryStats } = await supabase.from("categories").select("is_active, is_featured")

      // Estatísticas dos gigs (se a tabela existir)
      const { data: gigStats } = await supabase.from("gigs").select("budget").limit(1000)

      const totalCategories = categoryStats?.length || 0
      const activeCategories = categoryStats?.filter((c) => c.is_active).length || 0
      const featuredCategories = categoryStats?.filter((c) => c.is_featured).length || 0
      const totalGigs = gigStats?.length || 0
      const totalRevenue = gigStats?.reduce((sum, gig) => sum + (gig.budget || 0), 0) || 0

      setStats({
        total_categories: totalCategories,
        active_categories: activeCategories,
        featured_categories: featuredCategories,
        total_gigs: totalGigs,
        total_revenue: totalRevenue,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const buildCategoryHierarchy = (categories: any[]): Category[] => {
    const categoryMap = new Map()
    const rootCategories: Category[] = []

    // Criar mapa de categorias
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Construir hierarquia
    categories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id)

      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id)
        if (parent) {
          parent.children.push(categoryWithChildren)
        }
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    return rootCategories
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const categoryData = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || null,
        color: formData.color,
        parent_id: formData.parent_id || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        requires_verification: formData.requires_verification,
        sort_order: formData.sort_order,
        min_price: formData.min_price ? Number.parseFloat(formData.min_price) : null,
        max_price: formData.max_price ? Number.parseFloat(formData.max_price) : null,
        commission_rate: formData.commission_rate ? Number.parseFloat(formData.commission_rate) : null,
        updated_at: new Date().toISOString(),
      }

      console.log("💾 Salvando categoria:", categoryData)

      let error

      if (selectedCategory) {
        // Atualizar categoria existente
        const { error: updateError } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", selectedCategory.id)
        error = updateError
      } else {
        // Criar nova categoria
        const { error: insertError } = await supabase.from("categories").insert([
          {
            ...categoryData,
            created_at: new Date().toISOString(),
          },
        ])
        error = insertError
      }

      if (error) {
        console.error("❌ Erro ao salvar:", error)
        throw error
      }

      console.log("✅ Categoria salva com sucesso")

      toast({
        title: "Sucesso",
        description: selectedCategory ? "Categoria atualizada com sucesso" : "Categoria criada com sucesso",
      })

      setIsDialogOpen(false)
      resetForm()
      await loadCategories()
      await loadStats()
    } catch (error: any) {
      console.error("💥 Erro ao salvar categoria:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar categoria",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    console.log("✏️ Editando categoria:", category.name)
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "#3B82F6",
      parent_id: category.parent_id || "",
      is_active: category.is_active,
      is_featured: category.is_featured,
      requires_verification: category.requires_verification,
      sort_order: category.sort_order,
      min_price: category.min_price?.toString() || "",
      max_price: category.max_price?.toString() || "",
      commission_rate: category.commission_rate?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    try {
      console.log("🗑️ Removendo categoria:", categoryId)

      const { error } = await supabase.from("categories").delete().eq("id", categoryId)

      if (error) throw error

      console.log("✅ Categoria removida com sucesso")

      toast({
        title: "Sucesso",
        description: "Categoria removida com sucesso",
      })

      await loadCategories()
      await loadStats()
    } catch (error: any) {
      console.error("💥 Erro ao remover categoria:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover categoria",
        variant: "destructive",
      })
    }
  }

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("categories").update({ is_active: !currentStatus }).eq("id", categoryId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Categoria ${!currentStatus ? "ativada" : "desativada"} com sucesso`,
      })

      await loadCategories()
      await loadStats()
    } catch (error: any) {
      console.error("Erro ao alterar status:", error)
      toast({
        title: "Erro",
        description: "Erro ao alterar status da categoria",
        variant: "destructive",
      })
    }
  }

  const toggleFeatured = async (categoryId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase.from("categories").update({ is_featured: !currentFeatured }).eq("id", categoryId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Categoria ${!currentFeatured ? "destacada" : "removida dos destaques"} com sucesso`,
      })

      await loadCategories()
      await loadStats()
    } catch (error: any) {
      console.error("Erro ao alterar destaque:", error)
      toast({
        title: "Erro",
        description: "Erro ao alterar destaque da categoria",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    console.log("🔄 Resetando formulário")
    setSelectedCategory(null)
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "",
      color: "#3B82F6",
      parent_id: "",
      is_active: true,
      is_featured: false,
      requires_verification: false,
      sort_order: 0,
      min_price: "",
      max_price: "",
      commission_rate: "",
    })
  }

  const handleNewCategory = () => {
    console.log("➕ Criando nova categoria")
    resetForm()
    setIsDialogOpen(true)
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const getAllCategories = (cats: Category[]): Category[] => {
    const result: Category[] = []
    cats.forEach((cat) => {
      result.push(cat)
      if (cat.children && cat.children.length > 0) {
        result.push(...getAllCategories(cat.children))
      }
    })
    return result
  }

  const allCategories = getAllCategories(categories)

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && category.is_active) ||
      (filterStatus === "inactive" && !category.is_active) ||
      (filterStatus === "featured" && category.is_featured)

    return matchesSearch && matchesFilter
  })

  const renderCategoryRow = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id}>
        <div className="flex items-center justify-between p-4 border-b hover:bg-gray-50">
          <div className="flex items-center space-x-3" style={{ marginLeft: `${level * 20}px` }}>
            {hasChildren && (
              <Button variant="ghost" size="sm" onClick={() => toggleExpanded(category.id)} className="p-1 h-6 w-6">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}

            {!hasChildren && <div className="w-6" />}

            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-5 w-5 text-blue-500" />
              ) : (
                <Folder className="h-5 w-5 text-blue-500" />
              )
            ) : (
              <div className="h-5 w-5 flex items-center justify-center text-lg">{category.icon || "📁"}</div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{category.name}</span>
                {category.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              {category.description && <p className="text-sm text-gray-500 mt-1">{category.description}</p>}
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-400">Slug: {category.slug}</span>
                {category.commission_rate && (
                  <span className="text-xs text-gray-400">Comissão: {category.commission_rate}%</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{category.gig_count || 0}</span> gigs
            </div>

            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={() => toggleCategoryStatus(category.id, category.is_active)}>
                {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" size="sm" onClick={() => toggleFeatured(category.id, category.is_featured)}>
                <Star className={`h-4 w-4 ${category.is_featured ? "text-yellow-500 fill-current" : ""}`} />
              </Button>

              <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                <Edit className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover a categoria "{category.name}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(category.id)}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && category.children?.map((child) => renderCategoryRow(child, level + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando categorias...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Folder className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total_categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Ativas</p>
                <p className="text-2xl font-bold">{stats.active_categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Destacadas</p>
                <p className="text-2xl font-bold">{stats.featured_categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Gigs</p>
                <p className="text-2xl font-bold">{stats.total_gigs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Receita</p>
                <p className="text-2xl font-bold">€{stats.total_revenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Cabeçalho e controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Categorias</CardTitle>
              <CardDescription>Gerir categorias de serviços da plataforma</CardDescription>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadCategories} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Recarregar
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                    <DialogDescription>
                      {selectedCategory ? "Edite os dados da categoria" : "Crie uma nova categoria de serviços"}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Básico</TabsTrigger>
                        <TabsTrigger value="settings">Configurações</TabsTrigger>
                        <TabsTrigger value="pricing">Preços</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleNameChange(e.target.value)}
                              placeholder="Nome da categoria"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                              id="slug"
                              value={formData.slug}
                              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                              placeholder="slug-da-categoria"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Descrição da categoria"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="icon">Ícone (Emoji)</Label>
                            <Input
                              id="icon"
                              value={formData.icon}
                              onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                              placeholder="🔧"
                              maxLength={2}
                            />
                          </div>

                          <div>
                            <Label htmlFor="color">Cor</Label>
                            <Input
                              id="color"
                              type="color"
                              value={formData.color}
                              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor="sort_order">Ordem</Label>
                            <Input
                              id="sort_order"
                              type="number"
                              value={formData.sort_order}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, sort_order: Number.parseInt(e.target.value) || 0 }))
                              }
                              min="0"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="parent_id">Categoria Pai</Label>
                          <Select
                            value={formData.parent_id}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, parent_id: value === "none" ? "" : value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                              {allCategories
                                .filter((cat) => cat.id !== selectedCategory?.id)
                                .map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.icon} {category.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>

                      <TabsContent value="settings" className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="is_active">Categoria Ativa</Label>
                              <p className="text-sm text-gray-500">Categoria visível na plataforma</p>
                            </div>
                            <Switch
                              id="is_active"
                              checked={formData.is_active}
                              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="is_featured">Categoria Destacada</Label>
                              <p className="text-sm text-gray-500">Aparece em destaque na página inicial</p>
                            </div>
                            <Switch
                              id="is_featured"
                              checked={formData.is_featured}
                              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_featured: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="requires_verification">Requer Verificação</Label>
                              <p className="text-sm text-gray-500">Prestadores precisam ser verificados</p>
                            </div>
                            <Switch
                              id="requires_verification"
                              checked={formData.requires_verification}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, requires_verification: checked }))
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pricing" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="min_price">Preço Mínimo (€)</Label>
                            <Input
                              id="min_price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.min_price}
                              onChange={(e) => setFormData((prev) => ({ ...prev, min_price: e.target.value }))}
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label htmlFor="max_price">Preço Máximo (€)</Label>
                            <Input
                              id="max_price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.max_price}
                              onChange={(e) => setFormData((prev) => ({ ...prev, max_price: e.target.value }))}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
                          <Input
                            id="commission_rate"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.commission_rate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, commission_rate: e.target.value }))}
                            placeholder="5.00"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Taxa cobrada sobre cada transação nesta categoria
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? "Salvando..." : selectedCategory ? "Atualizar" : "Criar"} Categoria
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtros e busca */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
                <SelectItem value="featured">Destacadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de categorias */}
          <div className="border rounded-lg">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma categoria encontrada</p>
                {error && (
                  <Button variant="outline" onClick={loadCategories} className="mt-4 bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                )}
              </div>
            ) : (
              filteredCategories.map((category) => renderCategoryRow(category))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
