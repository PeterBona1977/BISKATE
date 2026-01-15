"use client"

import { useState, useEffect } from "react"
import { ModerationAlertsFixed } from "@/components/admin/moderation-alerts-fixed"
import { PageLoading } from "@/components/ui/page-loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function AdminModerationPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Verificar se o usuário é admin
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        setLoading(true)
        setError(null)

        // Verificar se o usuário está autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Usuário não autenticado")
          setLoading(false)
          return
        }

        // Verificar se o usuário é admin
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Erro ao verificar perfil:", profileError)
          setError("Erro ao verificar permissões de administrador")
          setLoading(false)
          return
        }

        if (profile?.role !== "admin") {
          setError("Acesso restrito a administradores")
          setLoading(false)
          return
        }

        setIsAdmin(true)
        setLoading(false)
      } catch (err) {
        console.error("Erro ao verificar acesso admin:", err)
        setError("Erro ao verificar permissões")
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [])

  if (loading) {
    return <PageLoading text="Verificando permissões..." />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderação de Conteúdo</h1>
        <p className="text-gray-500 mt-2">Revise e modere conteúdo sinalizado na plataforma.</p>
      </div>

      {isAdmin && <ModerationAlertsFixed />}
    </div>
  )
}
