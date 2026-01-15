"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RecommendationService,
  type Recommendation,
  type RecommendationStats,
} from "@/lib/recommendations/recommendation-service"
import { useAuth } from "@/contexts/auth-context"

interface UseRecommendationsOptions {
  excludeApplied?: boolean
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [stats, setStats] = useState<RecommendationStats>({
    totalRecommendations: 0,
    averageMatchScore: 0,
    topCategories: [],
    newThisWeek: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    excludeApplied = false,
    limit = 12,
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos
  } = options

  const loadRecommendations = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const result = await RecommendationService.getRecommendationsForProvider(user.id)

      setRecommendations(result.recommendations.slice(0, limit))
      setStats(result.stats)
    } catch (err) {
      console.error("Erro ao carregar recomendações:", err)
      setError("Não foi possível carregar as recomendações")

      // Fallback para recomendações genéricas
      try {
        const genericRecommendations = await RecommendationService.getGenericRecommendations()
        setRecommendations(genericRecommendations.slice(0, limit))
      } catch (fallbackError) {
        console.error("Erro ao carregar recomendações genéricas:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, limit])

  const refreshRecommendations = useCallback(async () => {
    setLoading(true)
    await loadRecommendations()
  }, [loadRecommendations])

  const markAsViewed = useCallback(
    async (gigId: string) => {
      if (!user?.id) return

      try {
        // Implementar tracking de visualizações se necessário
        console.log(`Gig ${gigId} visualizado por ${user.id}`)
      } catch (error) {
        console.error("Erro ao marcar como visualizado:", error)
      }
    },
    [user?.id],
  )

  // Carregar recomendações iniciais
  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  // Auto-refresh se habilitado
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadRecommendations()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadRecommendations])

  return {
    recommendations,
    stats,
    loading,
    error,
    refreshRecommendations,
    markAsViewed,
  }
}
