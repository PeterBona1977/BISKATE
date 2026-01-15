"use client"

import { RecommendationService } from "./recommendation-service"
import { NotificationService } from "@/lib/notifications/notification-service"
import { supabase } from "@/lib/supabase/client"

export class RecommendationNotifications {
  /**
   * Processa notificações quando um novo gig é criado
   */
  static async processNewGigNotifications(gigId: string): Promise<void> {
    try {
      console.log("🔔 Processando notificações para novo gig:", gigId)

      // 1. Buscar detalhes do gig
      const { data: gig, error: gigError } = await supabase
        .from("gigs")
        .select(`
          *,
          profiles!gigs_author_id_fkey (
            name,
            email
          )
        `)
        .eq("id", gigId)
        .single()

      if (gigError || !gig) {
        console.error("❌ Erro ao buscar gig:", gigError)
        return
      }

      // 2. Buscar todos os prestadores ativos
      const { data: providers, error: providersError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("is_provider", true)
        .eq("provider_status", "approved")

      if (providersError || !providers) {
        console.error("❌ Erro ao buscar prestadores:", providersError)
        return
      }

      console.log(`📋 Analisando ${providers.length} prestadores`)

      // 3. Para cada prestador, verificar se o gig é relevante
      const relevantProviders: Array<{
        providerId: string
        providerName: string
        providerEmail: string
        score: number
        reasons: string[]
      }> = []

      for (const provider of providers) {
        const recommendations = await RecommendationService.getRecommendationsForProvider(
          provider.id,
          1, // Só precisamos saber se é relevante
          { excludeApplied: false },
        )

        // Verificar se este gig específico está nas recomendações
        const relevantRecommendation = recommendations.find((rec) => rec.gigId === gigId)

        if (relevantRecommendation && relevantRecommendation.score >= 5.0) {
          // Score mínimo para notificação
          relevantProviders.push({
            providerId: provider.id,
            providerName: provider.name || "Prestador",
            providerEmail: provider.email || "",
            score: relevantRecommendation.score,
            reasons: relevantRecommendation.reasons,
          })
        }
      }

      console.log(`🎯 ${relevantProviders.length} prestadores relevantes encontrados`)

      // 4. Enviar notificações para prestadores relevantes
      for (const provider of relevantProviders) {
        await this.sendRecommendationNotification(gig, provider)
      }

      // 5. Registrar estatísticas
      await this.logNotificationStats(gigId, relevantProviders.length)
    } catch (error) {
      console.error("❌ Erro ao processar notificações:", error)
    }
  }

  /**
   * Envia notificação de recomendação para um prestador específico
   */
  private static async sendRecommendationNotification(
    gig: any,
    provider: {
      providerId: string
      providerName: string
      providerEmail: string
      score: number
      reasons: string[]
    },
  ): Promise<void> {
    try {
      const title = "🎯 Novo Biskate Recomendado!"
      const message = `"${gig.title}" - Score: ${provider.score}/10\n${provider.reasons.slice(0, 2).join(", ")}`

      // 1. Notificação na app
      await NotificationService.createNotification({
        recipientId: provider.providerId,
        title,
        message,
        type: "gig_recommendation",
        channel: "app",
        relatedGigId: gig.id,
        metadata: {
          score: provider.score,
          reasons: provider.reasons,
          gigTitle: gig.title,
          gigPrice: gig.price,
          gigLocation: gig.location,
        },
      })

      // 2. Push notification
      await NotificationService.sendPushNotification(
        provider.providerId,
        title,
        `"${gig.title}" - €${gig.price} em ${gig.location || "Localização não especificada"}`,
        {
          type: "gig_recommendation",
          gigId: gig.id,
          score: provider.score,
          url: `/dashboard/provider?gigId=${gig.id}`,
        },
      )

      // 3. Email (apenas para scores muito altos)
      if (provider.score >= 8.0) {
        await this.sendRecommendationEmail(gig, provider)
      }

      console.log(`✅ Notificação enviada para ${provider.providerName} (Score: ${provider.score})`)
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação para ${provider.providerName}:`, error)
    }
  }

  /**
   * Envia email de recomendação para scores altos
   */
  private static async sendRecommendationEmail(
    gig: any,
    provider: {
      providerId: string
      providerName: string
      providerEmail: string
      score: number
      reasons: string[]
    },
  ): Promise<void> {
    try {
      // Implementar envio de email aqui
      // Por agora, apenas log
      console.log(`📧 Email de recomendação seria enviado para ${provider.providerEmail}`)
    } catch (error) {
      console.error("❌ Erro ao enviar email:", error)
    }
  }

  /**
   * Registra estatísticas de notificações
   */
  private static async logNotificationStats(gigId: string, notificationsSent: number): Promise<void> {
    try {
      // Implementar logging de estatísticas
      console.log(`📊 Estatísticas: ${notificationsSent} notificações enviadas para gig ${gigId}`)
    } catch (error) {
      console.error("❌ Erro ao registrar estatísticas:", error)
    }
  }

  /**
   * Processa notificações em lote para múltiplos gigs
   */
  static async processBatchNotifications(gigIds: string[]): Promise<void> {
    console.log(`🔄 Processando notificações em lote para ${gigIds.length} gigs`)

    for (const gigId of gigIds) {
      await this.processNewGigNotifications(gigId)
      // Pequena pausa para não sobrecarregar
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log("✅ Processamento em lote concluído")
  }

  /**
   * Agenda processamento de notificações (para usar com cron jobs)
   */
  static async scheduleNotificationProcessing(): Promise<void> {
    try {
      // Buscar gigs criados nas últimas 24h que ainda não foram processados
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data: recentGigs, error } = await supabase
        .from("gigs")
        .select("id")
        .eq("status", "approved")
        .gte("created_at", yesterday.toISOString())

      if (error) {
        console.error("❌ Erro ao buscar gigs recentes:", error)
        return
      }

      if (recentGigs && recentGigs.length > 0) {
        const gigIds = recentGigs.map((gig) => gig.id)
        await this.processBatchNotifications(gigIds)
      }
    } catch (error) {
      console.error("❌ Erro no processamento agendado:", error)
    }
  }

  /**
   * Obtém configurações de notificação do prestador
   */
  static async getProviderNotificationSettings(providerId: string): Promise<{
    enableRecommendations: boolean
    minScore: number
    maxPerDay: number
    preferredChannels: string[]
  }> {
    try {
      const { data: settings, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", providerId)
        .single()

      if (error || !settings) {
        // Configurações padrão
        return {
          enableRecommendations: true,
          minScore: 5.0,
          maxPerDay: 10,
          preferredChannels: ["app", "push"],
        }
      }

      return {
        enableRecommendations: settings.enable_recommendations ?? true,
        minScore: settings.min_recommendation_score ?? 5.0,
        maxPerDay: settings.max_notifications_per_day ?? 10,
        preferredChannels: settings.preferred_notification_channels ?? ["app", "push"],
      }
    } catch (error) {
      console.error("❌ Erro ao buscar configurações:", error)
      return {
        enableRecommendations: true,
        minScore: 5.0,
        maxPerDay: 10,
        preferredChannels: ["app", "push"],
      }
    }
  }
}
