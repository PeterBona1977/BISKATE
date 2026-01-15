"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, User } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    role: "",
    plan: "",
    responses_used: 0,
  })

  const userId = params.id as string

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Erro ao buscar utilizador:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do utilizador.",
          variant: "destructive",
        })
        return
      }

      setUser(data)
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        bio: data.bio || "",
        role: data.role || "user",
        plan: data.plan || "free",
        responses_used: data.responses_used || 0,
      })
    } catch (err) {
      console.error("Erro inesperado:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          role: formData.role as any,
          plan: formData.plan as any,
          responses_used: formData.responses_used,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        console.error("Erro ao atualizar utilizador:", error)
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o utilizador.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Utilizador atualizado com sucesso.",
      })

      router.push(`/admin/users/${userId}`)
    } catch (err) {
      console.error("Erro inesperado:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar utilizador.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do utilizador...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Utilizador não encontrado.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Utilizador</h1>
            <p className="text-gray-500 mt-1">Edite as informações do utilizador {user.email}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome completo do utilizador"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+351 123 456 789"
              />
            </div>

            <div>
              <Label htmlFor="address">Morada</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Morada completa"
              />
            </div>

            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Biografia do utilizador"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilizador</SelectItem>
                  <SelectItem value="provider">Prestador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="plan">Plano</Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="essential">Essential</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responses_used">Respostas Utilizadas</Label>
              <Input
                id="responses_used"
                type="number"
                value={formData.responses_used}
                onChange={(e) => setFormData({ ...formData, responses_used: Number.parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Data de Registo:</span>
                <span>{new Date(user.created_at).toLocaleDateString("pt-PT")}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Última Atualização:</span>
                <span>
                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString("pt-PT") : "Nunca atualizado"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Alterações"}
        </Button>
      </div>
    </div>
  )
}
