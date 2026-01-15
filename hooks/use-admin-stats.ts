"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

export interface AdminStats {
  totalUsers: number
  totalGigs: number
  pendingGigs: number
  totalAlerts: number
  pendingAlerts: number
  totalResponses: number
  activeUsers: number
  recentActivity: number
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalGigs: 0,
    pendingGigs: 0,
    totalAlerts: 0,
    pendingAlerts: 0,
    totalResponses: 0,
    activeUsers: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)

      // Buscar estatísticas em paralelo
      const [usersResult, gigsResult, pendingGigsResult, alertsResult, pendingAlertsResult, responsesResult] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("gigs").select("id", { count: "exact", head: true }),
          supabase.from("gigs").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("moderation_alerts").select("id", { count: "exact", head: true }),
          supabase.from("moderation_alerts").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("gig_responses").select("id", { count: "exact", head: true }),
        ])

      setStats({
        totalUsers: usersResult.count || 0,
        totalGigs: gigsResult.count || 0,
        pendingGigs: pendingGigsResult.count || 0,
        totalAlerts: alertsResult.count || 0,
        pendingAlerts: pendingAlertsResult.count || 0,
        totalResponses: responsesResult.count || 0,
        activeUsers: Math.floor((usersResult.count || 0) * 0.7), // Estimativa
        recentActivity: Math.floor((gigsResult.count || 0) * 0.3), // Estimativa
      })
    } catch (error) {
      console.error("❌ Erro ao buscar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    refreshStats: fetchStats,
  }
}
