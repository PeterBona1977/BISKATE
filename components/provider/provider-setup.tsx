"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface ProviderSetupProps {
  initialData?: {
    bio?: string
    skills?: string[]
    portfolio_url?: string
    hourly_rate?: number
  }
  providerStatus?: string
}

export function ProviderSetup({ initialData, providerStatus }: ProviderSetupProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    bio: initialData?.bio || "",
    skills: initialData?.skills ? initialData.skills.join(", ") : "",
    portfolio_url: initialData?.portfolio_url || "",
    hourly_rate: initialData?.hourly_rate?.toString() || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erro",
        description: "Deves estar autenticado para atualizar o teu perfil.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          bio: formData.bio,
          skills: formData.skills.split(",").map((s) => s.trim()),
          portfolio_url: formData.portfolio_url,
          hourly_rate: Number.parseInt(formData.hourly_rate) || 0,
        })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      toast({
        title: "Perfil Atualizado",
        description: "O teu perfil de prestador foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o teu perfil. Tenta novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Prestador</CardTitle>
          <CardDescription>Configura o teu perfil de prestador de serviços.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Fala um pouco sobre ti e os teus serviços"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Competências</Label>
            <Input
              id="skills"
              name="skills"
              placeholder="ex: Programação, Design, Marketing (separados por vírgula)"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio_url">URL do Portfólio</Label>
            <Input
              id="portfolio_url"
              name="portfolio_url"
              placeholder="https://meuportfolio.com"
              value={formData.portfolio_url}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Taxa Horária (€)</Label>
            <Input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              placeholder="25"
              value={formData.hourly_rate}
              onChange={handleChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || providerStatus !== "approved"}>
            {saving ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
