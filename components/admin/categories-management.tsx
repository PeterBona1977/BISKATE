"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, FolderTree, Upload, X, ImageIcon } from "lucide-react"
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
  created_at: string
  subcategories?: Category[]
}

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    margin_percentage: 10,
    is_active: true,
    slug: "",
    icon: "",
  })

  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error

      // Organizar categorias em hierarquia
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid type",
        description: "Please select an image (PNG, JPG, WEBP).",
        variant: "destructive",
      })
      return
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "The image must be at most 2MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `category-icons/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("cms-media")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("cms-media")
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, icon: publicUrl }))
      toast({
        title: "Upload completed",
        description: "Image uploaded successfully.",
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload error",
        description: "Could not upload image.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const slug = formData.slug || generateSlug(formData.name)
      const categoryData = {
        ...formData,
        slug,
        parent_id: formData.parent_id || null,
        updated_at: new Date().toISOString(),
      }

      if (editingCategory) {
        const { error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id)

        if (error) throw error

        toast({
          title: "Category updated",
          description: "The category was successfully updated.",
        })
      } else {
        const { error } = await supabase.from("categories").insert([categoryData])

        if (error) throw error

        toast({
          title: "Category created",
          description: "The category was successfully created.",
        })
      }

      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Error",
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
    })
    setDialogOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId)

      if (error) throw error

      toast({
        title: "Category deleted",
        description: "The category was successfully deleted.",
      })

      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Error",
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
    })
    setEditingCategory(null)
  }

  const renderCategory = (category: Category, level = 0) => (
    <div key={category.id} className={`${level > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""}`}>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {category.icon && (
                category.icon.startsWith('http') ? (
                  <img src={category.icon} alt={category.name} className="w-10 h-10 object-cover rounded-md" />
                ) : (
                  <span className="text-2xl">{category.icon}</span>
                )
              )}
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">Margin: {category.margin_percentage}%</Badge>
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
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
      {category.subcategories?.map((sub) => renderCategory(sub, level + 1))}
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
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground">Manage service categories and subcategories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (!formData.slug) {
                      setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })
                    }
                  }}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Parent Category</label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (main category)</SelectItem>
                    {getAllCategories(categories)
                      .filter((cat) => !cat.parent_id && cat.id !== editingCategory?.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Margin (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.margin_percentage}
                  onChange={(e) => setFormData({ ...formData, margin_percentage: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="example-category"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category Icon</label>
                <div className="flex items-start space-x-4">
                  {formData.icon && (
                    <div className="relative group">
                      {formData.icon.startsWith('http') ? (
                        <img
                          src={formData.icon}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-md border text-3xl">
                          {formData.icon}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: "" })}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 512x512px. Max: 2MB.
                    </p>

                    {/* Fallback for manual emoji/text if needed */}
                    {!formData.icon && (
                      <div className="mt-2 text-xs">
                        <Input
                          placeholder="Or paste an emoji here..."
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          className="h-8"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Active category</label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderTree className="h-5 w-5 mr-2" />
            Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No categories found.</p>
            </div>
          ) : (
            <div className="space-y-4">{categories.map((category) => renderCategory(category))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
