// =====================================================
// BISKATE - SISTEMA DE VISUALIZAÇÃO DE CONTACTOS
// Funcionalidade core de monetização
// =====================================================

import { supabase } from "@/lib/supabase/client"
import { NotificationService } from "@/lib/notifications/notification-service"
import { triggerNotificationAction } from "@/app/actions/notifications"
import { PlanLimitsService } from "@/lib/monetization/plan-limits-service"
import type { Database } from "@/lib/supabase/database.types"

type ContactView = Database["public"]["Tables"]["contact_views"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export interface ContactViewResult {
  success: boolean
  error?: string
  contactInfo?: {
    fullName: string
    email: string
    phone?: string
  }
  creditsRemaining?: number
}

export class ContactViewService {
  /**
   * Verifica se o utilizador pode visualizar contactos
   */
  static async canViewContact(
    viewerId: string,
    gigId: string,
  ): Promise<{ canView: boolean; reason?: string; creditsNeeded?: number }> {
    try {
      // Verificar se já visualizou este contacto
      const { data: existingView } = await supabase
        .from("contact_views")
        .select("id")
        .eq("viewer_id", viewerId)
        .eq("gig_id", gigId)
        .single()

      if (existingView) {
        return { canView: true, reason: "already_viewed" }
      }

      // Verificar se é o próprio autor do gig
      const { data: gig } = await supabase.from("gigs").select("author_id").eq("id", gigId).single()

      if (gig?.author_id === viewerId) {
        return { canView: false, reason: "own_gig" }
      }

      // Check and reset quotas if needed (time-based reset)
      await PlanLimitsService.checkAndResetQuotas(viewerId)

      // Verificar créditos disponíveis
      const { data: profile } = await supabase
        .from("profiles")
        .select("responses_used, plan")
        .eq("id", viewerId)
        .single()

      if (!profile) {
        return { canView: false, reason: "profile_not_found" }
      }

      const maxResponses = this.getMaxResponses(profile.plan)
      const creditsRemaining = maxResponses - (profile.responses_used || 0)

      // Buscar custo de visualização das configurações
      const { data: config } = await supabase
        .from("platform_config")
        .select("value")
        .eq("category", "monetization")
        .eq("key", "contact_view_cost")
        .single()

      const creditsNeeded = Number.parseInt(config?.value || "1")

      if (creditsRemaining < creditsNeeded) {
        return {
          canView: false,
          reason: "insufficient_credits",
          creditsNeeded,
        }
      }

      return { canView: true, creditsNeeded }
    } catch (err) {
      console.error("❌ Error checking contact view permission:", err)
      return { canView: false, reason: "error" }
    }
  }

  /**
   * Processa a visualização de contacto (gasta créditos)
   */
  static async viewContact(viewerId: string, gigId: string): Promise<ContactViewResult> {
    try {
      console.log("👁️ Processing contact view:", { viewerId, gigId })

      // Verificar permissões primeiro
      const permission = await this.canViewContact(viewerId, gigId)
      if (!permission.canView) {
        return {
          success: false,
          error: this.getErrorMessage(permission.reason || "unknown"),
        }
      }

      // Se já visualizou, retornar contacto sem gastar créditos
      if (permission.reason === "already_viewed") {
        return await this.getContactInfo(gigId)
      }

      // Iniciar transação para gastar créditos e registar visualização
      const { data: gig } = await supabase.from("gigs").select("author_id").eq("id", gigId).single()

      if (!gig) {
        return { success: false, error: "Gig não encontrado" }
      }

      // Gastar crédito do utilizador
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("responses_used, plan")
        .eq("id", viewerId)
        .single()

      if (profileError || !profile) {
        return { success: false, error: "Perfil não encontrado" }
      }

      const creditsUsed = (profile.responses_used || 0) + (permission.creditsNeeded || 1)

      // Atualizar créditos
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          responses_used: creditsUsed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", viewerId)

      if (updateError) {
        console.error("❌ Error updating credits:", updateError)
        return { success: false, error: "Erro ao processar créditos" }
      }

      // Registar visualização
      const { error: viewError } = await supabase.from("contact_views").insert({
        viewer_id: viewerId,
        gig_id: gigId,
        gig_author_id: gig.author_id,
        credits_used: permission.creditsNeeded || 1,
        metadata: { timestamp: new Date().toISOString() },
      })

      if (viewError) {
        console.error("❌ Error recording contact view:", viewError)
        // Tentar reverter créditos se falhar
        await supabase.from("profiles").update({ responses_used: profile.responses_used }).eq("id", viewerId)

        return { success: false, error: "Erro ao registar visualização" }
      }

      // Enviar notificação ao autor do gig
      const gigInfo = await supabase.from("gigs").select("title").eq("id", gigId).single()

      await triggerNotificationAction("contact_viewed", {
        gigId,
        userId: gig.author_id,
        gigTitle: gigInfo?.data?.title || "Gig",
      })

      // Retornar informações de contacto
      const contactResult = await this.getContactInfo(gigId)

      if (contactResult.success) {
        const maxResponses = this.getMaxResponses(profile.plan)
        contactResult.creditsRemaining = maxResponses - creditsUsed
      }

      console.log("✅ Contact view processed successfully")
      return contactResult
    } catch (err) {
      console.error("❌ Exception processing contact view:", err)
      return { success: false, error: "Erro interno do sistema" }
    }
  }

  /**
   * Busca informações de contacto do autor do gig
   */
  private static async getContactInfo(gigId: string): Promise<ContactViewResult> {
    try {
      const { data: gigWithAuthor, error } = await supabase
        .from("gigs")
        .select(`
          author_id,
          profiles:author_id (
            full_name,
            email,
            phone
          )
        `)
        .eq("id", gigId)
        .single()

      if (error || !gigWithAuthor) {
        return { success: false, error: "Informações não encontradas" }
      }

      const profile = gigWithAuthor.profiles as any

      return {
        success: true,
        contactInfo: {
          fullName: profile.full_name || "Nome não informado",
          email: profile.email || "",
          phone: profile.phone || undefined,
        },
      }
    } catch (err) {
      console.error("❌ Error getting contact info:", err)
      return { success: false, error: "Erro ao buscar contacto" }
    }
  }

  /**
   * Verifica se o utilizador já visualizou um contacto
   */
  static async hasViewedContact(viewerId: string, gigId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from("contact_views")
        .select("id")
        .eq("viewer_id", viewerId)
        .eq("gig_id", gigId)
        .single()

      return !!data
    } catch {
      return false
    }
  }

  /**
   * Busca histórico de visualizações do utilizador
   */
  static async getUserContactViews(userId: string): Promise<ContactView[]> {
    try {
      const { data, error } = await supabase
        .from("contact_views")
        .select(`
          *,
          gigs:gig_id (
            title,
            category,
            price
          )
        `)
        .eq("viewer_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching contact views:", error)
        return []
      }

      return data || []
    } catch (err) {
      console.error("❌ Exception fetching contact views:", err)
      return []
    }
  }

  /**
   * Calcula máximo de respostas baseado no plano
   */
  private static getMaxResponses(plan: string): number {
    switch (plan) {
      case "free":
        return 1
      case "essential":
        return 50
      case "pro":
        return 150
      case "unlimited":
        return Number.POSITIVE_INFINITY
      default:
        return 0
    }
  }

  /**
   * Converte código de erro em mensagem amigável
   */
  private static getErrorMessage(reason: string): string {
    const messages: Record<string, string> = {
      own_gig: "Não pode visualizar o contacto do seu próprio gig",
      insufficient_credits: "Créditos insuficientes. Faça upgrade do seu plano",
      already_viewed: "Já visualizou este contacto",
      profile_not_found: "Perfil não encontrado",
      error: "Erro interno do sistema",
      unknown: "Erro desconhecido",
    }

    return messages[reason] || messages.unknown
  }

  /**
   * Estatísticas para admin
   */
  static async getContactViewStats(): Promise<{
    totalViews: number
    totalRevenue: number
    viewsToday: number
    topViewers: Array<{ userId: string; userName: string; viewCount: number }>
  }> {
    try {
      // Total de visualizações
      const { count: totalViews } = await supabase.from("contact_views").select("*", { count: "exact", head: true })

      // Visualizações hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: viewsToday } = await supabase
        .from("contact_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())

      // Receita total (assumindo 1 crédito = valor configurado)
      const { data: views } = await supabase.from("contact_views").select("credits_used")

      const totalCreditsUsed = views?.reduce((sum, view) => sum + (view.credits_used || 1), 0) || 0

      return {
        totalViews: totalViews || 0,
        totalRevenue: totalCreditsUsed, // Em créditos
        viewsToday: viewsToday || 0,
        topViewers: [], // Implementar se necessário
      }
    } catch (err) {
      console.error("❌ Error getting contact view stats:", err)
      return {
        totalViews: 0,
        totalRevenue: 0,
        viewsToday: 0,
        topViewers: [],
      }
    }
  }
}
