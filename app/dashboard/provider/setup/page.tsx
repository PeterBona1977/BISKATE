"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"

export default function ProviderSetupPage() {
  const router = useRouter()
  const { user, profile, isProvider } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [providerStatus, setProviderStatus] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    bio: "",
    skills: "",
    portfolio_url: "",
    hourly_rate: "",
  })

  useEffect(() => {
    const fetchProviderStatus = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Buscar status do prestador
        const { data: providerData, error: providerError } = await supabase
          .from("providers")
          .select("status")
          .eq("user_id", user.id)
          .single()

        if (providerError && providerError.code !== "PGRST116") {
          console.error("Erro ao buscar status do prestador:", providerError)
        }

        if (providerData) {
          setProviderStatus(providerData.status)
        }

        // Preencher formulário com dados do perfil
        if (profile) {
          setFormData({
            bio: profile.bio || "",
            skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
            portfolio_url: profile.portfolio_url || "",
            hourly_rate: profile.hourly_rate?.toString() || "",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do prestador.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProviderStatus()
  }, [user, profile])

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

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Negado</CardTitle>
          <CardDescription>Deves estar autenticado para aceder a esta página.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuração de Prestador</CardTitle>
              <CardDescription>Configura o teu perfil de prestador de serviços.</CardDescription>
            </div>
            <div>
              {providerStatus === "pending" && (
                <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                  <Clock className="h-4 w-4" />
                  <span>Pendente</span>
                </div>
              )}
              {providerStatus === "approved" && (
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Aprovado</span>
                </div>
              )}
              {providerStatus === "rejected" && (
                <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span>Rejeitado</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {providerStatus === "rejected" ? (
          <CardContent>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <h3 className="mb-2 font-semibold">Candidatura Rejeitada</h3>
              <p>
                Infelizmente, a tua candidatura para te tornares prestador foi rejeitada. Podes contactar o suporte para
                mais informações.
              </p>
            </div>
          </CardContent>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {providerStatus === "pending" && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                    <h3 className="mb-2 font-semibold">Candidatura em Análise</h3>
                    <p>
                      A tua candidatura para te tornares prestador está a ser analisada. Receberás uma notificação assim
                      que for aprovada.
                    </p>
                  </div>
                )}
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
                <Button variant="outline" onClick={() => router.push("/dashboard")} disabled={saving}>
                  Voltar
                </Button>
                <Button type="submit" disabled={saving || providerStatus !== "approved"}>
                  {saving ? "A guardar..." : "Guardar Alterações"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
