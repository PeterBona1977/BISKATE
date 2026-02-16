"use client"
import { triggerNotificationAction } from "@/app/actions/notifications"

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
    contentType?: string
    detectedPatterns?: string[]
    [key: string]: any
  }
}

export class NotificationTriggers {
  /**
   * Dispara gatilho quando um novo gig é criado
   */
  static async triggerGigCreated(gigId: string, gigTitle: string, authorId: string, authorName: string) {
    console.log("🔔 Triggering: gig_created")

    await triggerNotificationAction("gig_created", {
      gigId,
      gigTitle,
      userId: authorId,
      userName: authorName,
    })
  }

  /**
   * Dispara gatilho quando um gig é aprovado
   */
  static async triggerGigApproved(gigId: string, gigTitle: string, authorId: string) {
    console.log("🔔 Triggering: gig_approved")

    await triggerNotificationAction("gig_approved", {
      gigId,
      gigTitle,
      userId: authorId,
    })
  }

  /**
   * Dispara gatilho quando um gig é rejeitado
   */
  static async triggerGigRejected(gigId: string, gigTitle: string, authorId: string, rejectionReason: string) {
    console.log("🔔 Triggering: gig_rejected")

    await triggerNotificationAction("gig_rejected", {
      gigId,
      gigTitle,
      userId: authorId,
      rejectionReason,
    })
  }

  /**
   * Dispara gatilho quando uma resposta é recebida
   */
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

  /**
   * Dispara gatilho quando um contacto é visualizado
   */
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

  /**
   * Dispara gatilho quando um novo utilizador se regista
   */
  static async triggerUserRegistered(userId: string, userName: string, userEmail: string) {
    console.log("🔔 Triggering: user_registered")

    await triggerNotificationAction("user_registered", {
      userId,
      userName,
      userEmail,
    })
  }

  /**
   * Dispara gatilho quando conteúdo sensível é detectado
   */
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

  /**
   * Dispara gatilho quando novo feedback é recebido
   */
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

  /**
   * Dispara gatilho quando múltiplas tentativas de login falharam
   */
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

  /**
   * Dispara gatilho quando crédito de resposta é utilizado
   */
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

  /**
   * Dispara gatilho quando um gig é concluído
   */
  static async triggerGigCompleted(gigId: string, gigTitle: string, clientId: string, providerId: string) {
    console.log("🔔 Triggering: gig_completed")

    await triggerNotificationAction("gig_completed", {
      gigId,
      gigTitle,
      clientId,
      providerId,
    })
  }

  /**
   * Dispara gatilho quando uma resposta é aceite
   */
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

  /**
   * Dispara gatilho quando uma resposta é rejeitada
   */
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

  /**
   * Dispara gatilho quando uma candidatura de prestador é submetida
   */
  static async triggerProviderApplicationSubmitted(userId: string, userName: string, userEmail: string) {
    console.log("🔔 Triggering: provider_application_submitted")

    await triggerNotificationAction("provider_application_submitted", {
      userId,
      userName,
      userEmail,
    })
  }

  /**
   * Dispara gatilho quando uma resposta de emergência é recebida
   */
  static async triggerEmergencyResponseReceived(
    emergencyId: string,
    clientId: string,
    providerId: string,
    providerName: string,
    eta: string
  ) {
    console.log("🔔 Triggering: emergency_response_received")

    await triggerNotificationAction("emergency_response_received", {
      emergencyId,
      userId: clientId, // Client receives notification
      providerId,
      userName: providerName,
      eta
    })
  }

  /**
   * Dispara gatilho quando uma resposta de emergência é aceite
   */
  static async triggerEmergencyResponseAccepted(
    emergencyId: string,
    providerId: string,
    clientId: string,
    clientName: string
  ) {
    console.log("🔔 Triggering: emergency_response_accepted")

    await triggerNotificationAction("emergency_response_accepted", {
      emergencyId,
      userId: providerId, // Provider receives notification
      clientId,
      userName: clientName
    })
  }

  /**
   * Dispara gatilho quando o profissional inicia o trajeto
   */
  static async triggerEmergencyJourneyStarted(
    emergencyId: string,
    clientId: string,
    providerId: string,
    providerName: string
  ) {
    console.log("🔔 Triggering: emergency_journey_started")

    await triggerNotificationAction("emergency_journey_started", {
      emergencyId,
      userId: clientId, // Client receives notification
      providerId,
      userName: providerName
    })
  }
}

// Export constants from the separate file for backward compatibility
export { AVAILABLE_TRIGGERS, AVAILABLE_CHANNELS, AVAILABLE_RECIPIENTS } from './trigger-constants'

