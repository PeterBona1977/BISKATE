"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"

export type ModerationAlert = Database["public"]["Tables"]["moderation_alerts"]["Row"] & {
  profiles?: {
    full_name: string | null
    email: string | null
  }
  gigs?: {
    title: string | null
  }
}

export function useModerationAlerts() {
  const [alerts, setAlerts] = useState<ModerationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchAlerts = useCallback(async () => {
    try {
      console.log("🔍 Admin: Buscando alertas de moderação...")
      setLoading(true)

      const { data, error } = await supabase
        .from("moderation_alerts")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          gigs:gig_id (
            title
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Admin: Erro ao buscar alertas:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os alertas de moderação.",
          variant: "destructive",
        })
        return
      }

      console.log(`✅ Admin: ${data?.length || 0} alertas carregados`)
      setAlerts(data || [])
    } catch (err) {
      console.error("❌ Admin: Erro inesperado:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar alertas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updateAlertStatus = useCallback(
    async (alertId: string, status: string, resolution?: string) => {
      try {
        console.log(`🔄 Admin: Atualizando status do alerta ${alertId} para ${status}`)

        const { error } = await supabase
          .from("moderation_alerts")
          .update({
            status: status as any,
            resolution: resolution || null,
            resolved_at: status === "resolved" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", alertId)

        if (error) {
          console.error("❌ Admin: Erro ao atualizar alerta:", error)
          toast({
            title: "Erro",
            description: "Não foi possível atualizar o alerta.",
            variant: "destructive",
          })
          return false
        }

        console.log("✅ Admin: Alerta atualizado com sucesso")
        toast({
          title: "Sucesso",
          description: "Alerta atualizado com sucesso.",
        })

        await fetchAlerts()
        return true
      } catch (err) {
        console.error("❌ Admin: Erro inesperado:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado ao atualizar alerta.",
          variant: "destructive",
        })
        return false
      }
    },
    [fetchAlerts, toast],
  )

  const deleteAlert = useCallback(
    async (alertId: string) => {
      try {
        console.log(`🗑️ Admin: Apagando alerta ${alertId}`)

        const { error } = await supabase.from("moderation_alerts").delete().eq("id", alertId)

        if (error) {
          console.error("❌ Admin: Erro ao apagar alerta:", error)
          toast({
            title: "Erro",
            description: "Não foi possível apagar o alerta.",
            variant: "destructive",
          })
          return false
        }

        console.log("✅ Admin: Alerta apagado com sucesso")
        toast({
          title: "Sucesso",
          description: "Alerta apagado com sucesso.",
        })

        await fetchAlerts()
        return true
      } catch (err) {
        console.error("❌ Admin: Erro inesperado:", err)
        toast({
          title: "Erro",
          description: "Erro inesperado ao apagar alerta.",
          variant: "destructive",
        })
        return false
      }
    },
    [fetchAlerts, toast],
  )

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.gigs?.title?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter

    return matchesSearch && matchesStatus && matchesSeverity
  })

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return {
    alerts,
    filteredAlerts,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    updateAlertStatus,
    deleteAlert,
    fetchAlerts,
  }
}
