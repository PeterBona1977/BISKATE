"use client"

import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Review = Database["public"]["Tables"]["reviews"]["Row"]
type Badge = Database["public"]["Tables"]["badges"]["Row"]
type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"]
type ReputationStats = Database["public"]["Tables"]["reputation_stats"]["Row"]

export interface CreateReviewData {
  gig_id: string
  payment_id?: string
  reviewee_id: string
  review_type: "client_to_provider" | "provider_to_client"
  rating: number
  title: string
  comment: string
  communication_rating?: number
  quality_rating?: number
  timeliness_rating?: number
  professionalism_rating?: number
  is_anonymous?: boolean
}

export class ReviewService {
  /**
   * Criar uma nova avaliação
   */
  static async createReview(data: CreateReviewData, reviewerId: string): Promise<{ data: Review | null; error: any }> {
    try {
      console.log("⭐ Criando avaliação:", data.title)

      const reviewData = {
        ...data,
        reviewer_id: reviewerId,
        status: "pending", // Será aprovado após moderação
        created_at: new Date().toISOString(),
      }

      const { data: review, error } = await supabase.from("reviews").insert(reviewData).select().single()

      if (error) {
        console.error("❌ Erro ao criar avaliação:", error)
        return { data: null, error }
      }

      console.log("✅ Avaliação criada:", review.id)

      // Auto-aprovar por enquanto (em produção, seria moderado)
      await this.approveReview(review.id)

      return { data: review, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Aprovar avaliação (moderação)
   */
  static async approveReview(reviewId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          status: "approved",
          moderated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)

      if (error) {
        console.error("❌ Erro ao aprovar avaliação:", error)
        return { error }
      }

      return { error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { error: err }
    }
  }

  /**
   * Buscar avaliações de um usuário
   */
  static async getUserReviews(userId: string): Promise<{ data: Review[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviewer_id (
            full_name,
            avatar_url
          ),
          gig:gigs (
            title,
            category
          )
        `)
        .eq("reviewee_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar avaliações:", error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: [], error: err }
    }
  }

  /**
   * Buscar estatísticas de reputação
   */
  static async getReputationStats(userId: string): Promise<{ data: ReputationStats | null; error: any }> {
    try {
      const { data, error } = await supabase.from("reputation_stats").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("❌ Erro ao buscar estatísticas:", error)
        return { data: null, error }
      }

      return { data: data || null, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Buscar badges do usuário
   */
  static async getUserBadges(userId: string): Promise<{ data: (UserBadge & { badge: Badge })[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          *,
          badge:badges (*)
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar badges:", error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: [], error: err }
    }
  }

  /**
   * Verificar e conceder badges automaticamente
   */
  static async checkAndAwardBadges(userId: string): Promise<{ newBadges: Badge[]; error?: any }> {
    try {
      console.log("🏆 Verificando badges para usuário:", userId)

      // Buscar estatísticas atuais
      const { data: stats } = await this.getReputationStats(userId)
      if (!stats) return { newBadges: [] }

      // Buscar todos os badges disponíveis
      const { data: allBadges } = await supabase.from("badges").select("*").eq("is_active", true)
      if (!allBadges) return { newBadges: [] }

      // Buscar badges já conquistados
      const { data: userBadges } = await supabase.from("user_badges").select("badge_id").eq("user_id", userId)

      const earnedBadgeIds = userBadges?.map((ub) => ub.badge_id) || []
      const newBadges: Badge[] = []

      // Verificar cada badge
      for (const badge of allBadges) {
        if (earnedBadgeIds.includes(badge.id)) continue

        const criteria = badge.criteria as any
        let shouldAward = false

        // Verificar critérios
        if (criteria.min_reviews && stats.total_reviews_received >= criteria.min_reviews) {
          if (criteria.min_rating) {
            shouldAward = stats.rating >= criteria.min_rating
          } else {
            shouldAward = true
          }
        }

        if (criteria.min_communication && stats.avg_communication >= criteria.min_communication) {
          shouldAward = stats.total_reviews_received >= (criteria.min_reviews || 1)
        }

        if (criteria.min_quality && stats.avg_quality >= criteria.min_quality) {
          shouldAward = stats.total_reviews_received >= (criteria.min_reviews || 1)
        }

        if (criteria.min_timeliness && stats.avg_timeliness >= criteria.min_timeliness) {
          shouldAward = stats.total_reviews_received >= (criteria.min_reviews || 1)
        }

        if (criteria.min_professionalism && stats.avg_professionalism >= criteria.min_professionalism) {
          shouldAward = stats.total_reviews_received >= (criteria.min_reviews || 1)
        }

        if (shouldAward) {
          // Conceder badge
          const { error: awardError } = await supabase.from("user_badges").insert({
            user_id: userId,
            badge_id: badge.id,
            earned_for: `Conquistado pelos critérios: ${JSON.stringify(criteria)}`,
            earned_at: new Date().toISOString(),
          })

          if (!awardError) {
            newBadges.push(badge)
            console.log(`🏆 Badge conquistado: ${badge.name}`)
          }
        }
      }

      return { newBadges }
    } catch (err) {
      console.error("❌ Erro ao verificar badges:", err)
      return { newBadges: [], error: err }
    }
  }

  /**
   * Denunciar avaliação
   */
  static async reportReview(
    reviewId: string,
    reporterId: string,
    reason: string,
    description?: string,
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase.from("review_reports").insert({
        review_id: reviewId,
        reporter_id: reporterId,
        reason,
        description,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("❌ Erro ao denunciar avaliação:", error)
        return { error }
      }

      // Notificar administradores
      const { NotificationTriggers } = await import("@/lib/notifications/notification-triggers")
      await NotificationTriggers.triggerSensitiveContentDetected(
        reviewId, // Usando reviewId como alertId simplificado
        reporterId,
        "review_report",
        [reason]
      )

      return { error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { error: err }
    }
  }

  /**
   * Verificar se usuário pode avaliar
   */
  static async canUserReview(
    gigId: string,
    reviewerId: string,
    revieweeId: string,
    reviewType: "client_to_provider" | "provider_to_client",
  ): Promise<{ canReview: boolean; reason?: string }> {
    try {
      // Verificar se já avaliou
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("gig_id", gigId)
        .eq("reviewer_id", reviewerId)
        .eq("reviewee_id", revieweeId)
        .eq("review_type", reviewType)
        .single()

      if (existingReview) {
        return { canReview: false, reason: "Você já avaliou este usuário para este projeto" }
      }

      // Verificar se o gig foi concluído
      const { data: gig } = await supabase.from("gigs").select("status").eq("id", gigId).single()

      if (!gig || gig.status !== "completed") {
        return { canReview: false, reason: "O projeto precisa estar concluído para avaliar" }
      }

      return { canReview: true }
    } catch (err) {
      console.error("❌ Erro ao verificar permissão:", err)
      return { canReview: false, reason: "Erro ao verificar permissões" }
    }
  }

  /**
   * Formatar nível de reputação
   */
  static getReputationLevelInfo(level: string): { label: string; color: string; icon: string } {
    const levels: Record<string, { label: string; color: string; icon: string }> = {
      novice: { label: "Novato", color: "#6B7280", icon: "🌱" },
      bronze: { label: "Bronze", color: "#CD7F32", icon: "🥉" },
      silver: { label: "Prata", color: "#C0C0C0", icon: "🥈" },
      gold: { label: "Ouro", color: "#FFD700", icon: "🥇" },
      platinum: { label: "Platina", color: "#E5E4E2", icon: "💎" },
      diamond: { label: "Diamante", color: "#B9F2FF", icon: "💠" },
    }

    return levels[level] || levels.novice
  }

  /**
   * Calcular score de confiança
   */
  static calculateTrustScore(stats: ReputationStats): number {
    if (!stats || stats.total_reviews_received === 0) return 0

    const ratingWeight = 0.4
    const volumeWeight = 0.3
    const consistencyWeight = 0.3

    // Score baseado no rating (0-100)
    const ratingScore = (stats.rating / 5) * 100

    // Score baseado no volume (logarítmico)
    const volumeScore = Math.min(100, Math.log10(stats.total_reviews_received + 1) * 50)

    // Score de consistência (baseado na distribuição dos critérios)
    const avgCriteria =
      (stats.avg_communication + stats.avg_quality + stats.avg_timeliness + stats.avg_professionalism) / 4
    const consistencyScore = (avgCriteria / 5) * 100

    const totalScore = ratingScore * ratingWeight + volumeScore * volumeWeight + consistencyScore * consistencyWeight

    return Math.round(totalScore)
  }
}
