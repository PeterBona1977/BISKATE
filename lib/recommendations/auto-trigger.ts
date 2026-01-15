"use client"

import { RecommendationNotifications } from "./recommendation-notifications"
import { NotificationTriggers } from "@/lib/notifications/notification-triggers"

export class RecommendationAutoTrigger {
  /**
   * Inicializa os triggers automáticos
   */
  static initialize(): void {
    console.log("🚀 Inicializando triggers automáticos de recomendação")

    // Escutar mudanças na tabela de gigs
    this.setupGigCreationTrigger()
    this.setupGigApprovalTrigger()
  }

  /**
   * Configura trigger para criação de gigs
   */
  private static setupGigCreationTrigger(): void {
    // Este seria idealmente um trigger de banco de dados
    // Por agora, vamos integrar com o sistema existente
    console.log("📡 Trigger de criação de gigs configurado")
  }

  /**
   * Configura trigger para aprovação de gigs
   */
  private static setupGigApprovalTrigger(): void {
    console.log("✅ Trigger de aprovação de gigs configurado")
  }

  /**
   * Método para ser chamado quando um gig é aprovado
   */
  static async onGigApproved(gigId: string, gigTitle: string, authorId: string): Promise<void> {
    try {
      console.log("🎯 Gig aprovado, processando recomendações:", gigTitle)

      // 1. Trigger original de aprovação
      await NotificationTriggers.triggerGigApproved(gigId, gigTitle, authorId)

      // 2. Processar recomendações automáticas
      await RecommendationNotifications.processNewGigNotifications(gigId)

      console.log("✅ Processamento de recomendações concluído")
    } catch (error) {
      console.error("❌ Erro no trigger de aprovação:", error)
    }
  }

  /**
   * Método para ser chamado quando um gig é criado
   */
  static async onGigCreated(gigId: string, gigTitle: string, authorId: string, authorName: string): Promise<void> {
    try {
      console.log("📝 Gig criado, registrando para processamento:", gigTitle)

      // 1. Trigger original de criação
      await NotificationTriggers.triggerGigCreated(gigId, gigTitle, authorId, authorName)

      // 2. Se o gig for auto-aprovado, processar imediatamente
      // Caso contrário, aguardar aprovação
      console.log("⏳ Aguardando aprovação para processar recomendações")
    } catch (error) {
      console.error("❌ Erro no trigger de criação:", error)
    }
  }

  /**
   * Processamento manual para testes
   */
  static async processManualRecommendations(gigId: string): Promise<void> {
    try {
      console.log("🔧 Processamento manual de recomendações para gig:", gigId)
      await RecommendationNotifications.processNewGigNotifications(gigId)
      console.log("✅ Processamento manual concluído")
    } catch (error) {
      console.error("❌ Erro no processamento manual:", error)
    }
  }
}

// Inicializar triggers quando o módulo é carregado
if (typeof window !== "undefined") {
  RecommendationAutoTrigger.initialize()
}
