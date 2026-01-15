"use client"
import { NotificationService } from "./notification-service"
import { triggerNotificationAction } from "@/app/actions/notifications"
import { ProfileCompletionService } from "@/lib/profile/profile-completion-service"

export interface TriggerEvent {
  event: string
  data: {
    gigId?: string
    responseId?: string
    userId?: string
    gigTitle?: string
    userName?: string
    rejectionReason?: string
    feedbackId?: string
    alertId?: string
    completionScore?: number
    [key: string]: any
  }
}

export class NotificationTriggersEnhanced {
  /**
   * Dispara gatilho quando utilizador se regista (verificar completude após 1 dia)
   */
  static async triggerUserRegistered(userId: string, userName: string, userEmail: string) {
    console.log("🔔 Triggering: user_registered")

    await triggerNotificationAction("user_registered", {
      userId,
      userName,
      userEmail,
    })

    // Agendar verificação de completude após 24 horas
    setTimeout(
      async () => {
        await this.checkProfileCompletionReminder(userId)
      },
      24 * 60 * 60 * 1000,
    ) // 24 horas
  }

  /**
   * Dispara gatilho quando perfil é atualizado
   */
  static async triggerProfileUpdated(userId: string, userName: string) {
    console.log("🔔 Triggering: profile_updated")

    // Calcular nova completude
    const completionData = await ProfileCompletionService.calculateProfileCompletion(userId)

    if (completionData) {
      // Atualizar pontuação na base de dados
      await ProfileCompletionService.updateProfileCompletionScore(userId)

      // Se perfil foi completado pela primeira vez
      if (completionData.percentage >= 80) {
        await triggerNotificationAction("profile_completed", {
          userId,
          userName,
          completionScore: completionData.percentage,
        })
      }
    }
  }

  /**
   * Verifica e envia lembrete de completude se necessário
   */
  static async checkProfileCompletionReminder(userId: string) {
    try {
      await ProfileCompletionService.checkAndSendReminder(userId)
    } catch (error) {
      console.error("Error checking profile completion reminder:", error)
    }
  }

  /**
   * Dispara gatilho quando gig é criado (verificar se perfil está completo)
   */
  static async triggerGigCreated(gigId: string, gigTitle: string, authorId: string, authorName: string) {
    console.log("🔔 Triggering: gig_created")

    await triggerNotificationAction("gig_created", {
      gigId,
      gigTitle,
      userId: authorId,
      userName: authorName,
    })

    // Verificar completude do perfil do autor
    const completionData = await ProfileCompletionService.calculateProfileCompletion(authorId)

    if (completionData && completionData.percentage < 80) {
      // Enviar dica sobre perfil completo
      await NotificationService.createNotification({
        recipientId: authorId,
        title: "Dica: Complete o seu perfil para mais sucesso! 💡",
        message: `O seu gig "${gigTitle}" foi criado! Perfis completos recebem 3x mais propostas. O seu está ${completionData.percentage}% completo.`,
        type: "profile_tip",
        channel: "app",
        relatedGigId: gigId,
        metadata: {
          completion_score: completionData.percentage,
          tip_type: "profile_completion_after_gig",
        },
      })
    }
  }

  /**
   * Dispara gatilho quando proposta é enviada (verificar perfil do prestador)
   */
  static async triggerProposalSent(
    proposalId: string,
    gigId: string,
    gigTitle: string,
    providerId: string,
    providerName: string,
  ) {
    console.log("🔔 Triggering: proposal_sent")

    // Verificar completude do perfil do prestador
    const completionData = await ProfileCompletionService.calculateProfileCompletion(providerId)

    if (completionData && completionData.percentage < 80) {
      // Enviar dica sobre perfil completo
      await NotificationService.createNotification({
        recipientId: providerId,
        title: "Aumente as suas hipóteses de sucesso! 🎯",
        message: `Proposta enviada para "${gigTitle}"! Perfis completos têm 3x mais hipóteses de serem aceites. O seu está ${completionData.percentage}% completo.`,
        type: "profile_tip",
        channel: "app",
        relatedGigId: gigId,
        metadata: {
          completion_score: completionData.percentage,
          tip_type: "profile_completion_after_proposal",
          proposal_id: proposalId,
        },
      })
    }
  }

  /**
   * Envia lembretes em lote para utilizadores com perfis incompletos
   */
  static async sendBatchProfileReminders(): Promise<number> {
    try {
      const reminderCount = await ProfileCompletionService.sendBatchReminders()
      console.log(`📧 Sent ${reminderCount} profile completion reminders`)
      return reminderCount
    } catch (error) {
      console.error("Error sending batch profile reminders:", error)
      return 0
    }
  }

  /**
   * Dispara celebração quando perfil é completado
   */
  static async triggerProfileCompleted(userId: string, userName: string, completionScore: number) {
    console.log("🔔 Triggering: profile_completed")

    await NotificationService.createNotification({
      recipientId: userId,
      title: "🎉 Parabéns! Perfil Completo!",
      message: `Excelente, ${userName}! O seu perfil está agora ${completionScore}% completo. Perfis completos recebem até 3x mais propostas na plataforma GIGHUB.`,
      type: "profile_completed",
      channel: "app",
      metadata: {
        completion_score: completionScore,
        achievement: "profile_complete",
        celebration: true,
      },
    })

    // Também enviar por email se for um marco importante
    if (completionScore >= 90) {
      await NotificationService.createNotification({
        recipientId: userId,
        title: "🌟 Perfil Excelente Alcançado!",
        message: `${userName}, o seu perfil está agora ${completionScore}% completo - isso é excelente! Continue assim para maximizar o seu sucesso na plataforma.`,
        type: "profile_excellence",
        channel: "email",
        metadata: {
          completion_score: completionScore,
          achievement: "profile_excellence",
        },
      })
    }
  }

  // Manter todos os outros métodos existentes...
  static async triggerGigApproved(gigId: string, gigTitle: string, authorId: string) {
    console.log("🔔 Triggering: gig_approved")
    await triggerNotificationAction("gig_approved", {
      gigId,
      gigTitle,
      userId: authorId,
    })
  }

  static async triggerGigRejected(gigId: string, gigTitle: string, authorId: string, rejectionReason: string) {
    console.log("🔔 Triggering: gig_rejected")
    await triggerNotificationAction("gig_rejected", {
      gigId,
      gigTitle,
      userId: authorId,
      rejectionReason,
    })
  }

  static async triggerResponseReceived(
    responseId: string,
    gigId: string,
    gigTitle: string,
    recipientId: string, // Autor do Gig
    responderName: string,
  ) {
    console.log("🔔 Triggering: response_received")
    await triggerNotificationAction("response_received", {
      responseId,
      gigId,
      gigTitle,
      userId: recipientId,
      userName: responderName,
    })
  }

  static async triggerContactViewed(
    gigId: string,
    gigTitle: string,
    viewerId: string,
    viewerName: string,
    gigAuthorId: string,
  ) {
    console.log("🔔 Triggering: contact_viewed")
    await triggerNotificationAction("contact_viewed", {
      gigId,
      gigTitle,
      userId: viewerId,
      userName: viewerName,
      gigAuthorId,
    })
  }

  static async triggerSensitiveContentDetected(
    alertId: string,
    userId: string,
    contentType: string,
    detectedPatterns: string[],
  ) {
    console.log("🔔 Triggering: sensitive_content_detected")
    await triggerNotificationAction("sensitive_content_detected", {
      alertId,
      userId,
      contentType,
      detectedPatterns: detectedPatterns.join(", "),
    })
  }

  static async triggerFeedbackReceived(
    feedbackId: string,
    userId: string,
    userName: string,
    category: string,
    subject: string,
  ) {
    console.log("🔔 Triggering: feedback_received")
    await triggerNotificationAction("feedback_received", {
      feedbackId,
      userId,
      userName,
      category,
      subject,
    })
  }

  static async triggerMultipleLoginFailures(
    userId: string,
    userEmail: string,
    attemptCount: number,
    ipAddress: string,
  ) {
    console.log("🔔 Triggering: multiple_login_failures")
    await triggerNotificationAction("multiple_login_failures", {
      userId,
      userEmail,
      attemptCount: attemptCount.toString(),
      ipAddress,
    })
  }

  static async triggerCreditUsed(
    userId: string,
    userName: string,
    gigId: string,
    gigTitle: string,
    creditsUsed: number,
  ) {
    console.log("🔔 Triggering: credit_used")
    await triggerNotificationAction("credit_used", {
      userId,
      userName,
      gigId,
      gigTitle,
      creditsUsed: creditsUsed.toString(),
    })
  }

  static async triggerGigCompleted(gigId: string, gigTitle: string, clientId: string, providerId: string) {
    console.log("🔔 Triggering: gig_completed")
    await triggerNotificationAction("gig_completed", {
      gigId,
      gigTitle,
      clientId,
      providerId,
    })
  }

  static async triggerResponseAccepted(
    responseId: string,
    gigId: string,
    gigTitle: string,
    providerId: string,
    clientName: string,
  ) {
    console.log("🔔 Triggering: response_accepted")
    await triggerNotificationAction("response_accepted", {
      responseId,
      gigId,
      gigTitle,
      userId: providerId,
      userName: clientName,
    })
  }

  static async triggerResponseRejected(
    responseId: string,
    gigId: string,
    gigTitle: string,
    providerId: string,
    clientName: string,
    rejectionReason?: string,
  ) {
    console.log("🔔 Triggering: response_rejected")

    await triggerNotificationAction("response_rejected", {
      responseId,
      gigId,
      gigTitle,
      userId: providerId,
      userName: clientName,
      rejectionReason,
    })
  }
}
