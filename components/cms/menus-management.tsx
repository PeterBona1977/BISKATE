"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Menu, GripVertical, Eye, EyeOff } from "lucide-react"

interface MenuItem {
  label: string
  url: string
  icon?: string
  order: number
}

interface CMSMenu {
  id: string
  menu_key: string
  title: string
  items: MenuItem[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export function MenusManagement() {
  const [menus, setMenus] = useState<CMSMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMenu, setEditingMenu] = useState<CMSMenu | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("cms_menus").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setMenus(data || [])
    } catch (err) {
      console.error("❌ Erro ao carregar menus:", err)
      toast({
        title: "Erro",
        description: "Erro ao carregar menus do CMS",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveMenu = async (menuData: Partial<CMSMenu>) => {
    try {
      const isEditing = !!editingMenu

      if (isEditing) {
        const { error } = await supabase
          .from("cms_menus")
          .update({
            ...menuData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMenu.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("cms_menus").insert({
          ...menuData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: `Menu ${isEditing ? "atualizado" : "criado"} com sucesso!`,
      })

      setIsDialogOpen(false)
      setEditingMenu(null)
      fetchMenus()
    } catch (err) {
      console.error("❌ Erro ao salvar menu:", err)
      toast({
        title: "Erro",
        description: "Erro ao salvar menu",
        variant: "destructive",
      })
    }
  }

  const toggleMenu = async (menuId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("cms_menus")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", menuId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Menu ${isActive ? "ativado" : "desativado"} com sucesso!`,
      })

      fetchMenus()
    } catch (err) {
      console.error("❌ Erro ao alterar status do menu:", err)
      toast({
        title: "Erro",
        description: "Erro ao alterar status do menu",
        variant: "destructive",
      })
    }
  }

  const deleteMenu = async (menuId: string) => {
    if (!confirm("Tem certeza que deseja eliminar este menu?")) return

    try {
      const { error } = await supabase.from("cms_menus").delete().eq("id", menuId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Menu eliminado com sucesso!",
      })

      fetchMenus()
    } catch (err) {
      console.error("❌ Erro ao eliminar menu:", err)
      toast({
        title: "Erro",
        description: "Erro ao eliminar menu",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Menus</h2>
          <p className="text-gray-600">Gira menus de navegação do site</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMenu(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMenu ? "Editar Menu" : "Novo Menu"}</DialogTitle>
            </DialogHeader>
            <MenuForm
              menu={editingMenu}
              onSave={saveMenu}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingMenu(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Menus */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando menus...</p>
          </div>
        ) : menus.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Menu className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum menu encontrado</h3>
              <p className="text-gray-600 mb-4">Comece criando o seu primeiro menu de navegação.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Menu
              </Button>
            </CardContent>
          </Card>
        ) : (
          menus.map((menu) => (
            <Card key={menu.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium">{menu.title}</h3>
                      <div className="flex items-center space-x-2">
                        {menu.is_active ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${menu.is_active ? "text-green-600" : "text-gray-400"}`}>
                          {menu.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Chave:</strong> {menu.menu_key}
                    </p>
                    <div className="text-xs text-gray-500">
                      {menu.items?.length || 0} itens • Atualizado: {new Date(menu.updated_at).toLocaleString("pt-PT")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={menu.is_active} onCheckedChange={(checked) => toggleMenu(menu.id, checked)} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingMenu(menu)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteMenu(menu.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview dos itens do menu */}
                {menu.items && menu.items.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Itens do Menu:</h4>
                    <div className="space-y-2">
                      {menu.items
                        .sort((a, b) => a.order - b.order)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                          >
                            <GripVertical className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{item.label}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-blue-600">{item.url}</span>
                          </div>
                        ))}
                    </div>
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

// Componente do formulário de menu
function MenuForm({
  menu,
  onSave,
  onCancel,
}: {
  menu: CMSMenu | null
  onSave: (data: Partial<CMSMenu>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: menu?.title || "",
    menu_key: menu?.menu_key || "",
    is_active: menu?.is_active ?? true,
  })

  const [menuItems, setMenuItems] = useState<MenuItem[]>(menu?.items || [{ label: "", url: "", order: 1 }])

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
      menu_key: prev.menu_key || generateKey(title),
    }))
  }

  const addMenuItem = () => {
    setMenuItems((prev) => [...prev, { label: "", url: "", order: prev.length + 1 }])
  }

  const removeMenuItem = (index: number) => {
    setMenuItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string | number) => {
    setMenuItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validItems = menuItems.filter((item) => item.label && item.url)

    onSave({
      title: formData.title,
      menu_key: formData.menu_key,
      items: validItems,
      is_active: formData.is_active,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Título</label>
        <Input
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Título do menu"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Chave do Menu</label>
        <Input
          value={formData.menu_key}
          onChange={(e) => setFormData((prev) => ({ ...prev, menu_key: e.target.value }))}
          placeholder="chave_do_menu"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Identificador único para este menu (usado no código)</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium">Itens do Menu</label>
          <Button type="button" variant="outline" size="sm" onClick={addMenuItem}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </div>

        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  placeholder="Rótulo"
                  value={item.label}
                  onChange={(e) => updateMenuItem(index, "label", e.target.value)}
                />
                <Input
                  placeholder="URL"
                  value={item.url}
                  onChange={(e) => updateMenuItem(index, "url", e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeMenuItem(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
        />
        <label className="text-sm font-medium">Menu ativo</label>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{menu ? "Atualizar" : "Criar"} Menu</Button>
      </div>
    </form>
  )
}
