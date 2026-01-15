"use client"

import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Payment = Database["public"]["Tables"]["payments"]["Row"]
type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
type PaymentSettings = Database["public"]["Tables"]["payment_settings"]["Row"]

export interface CreatePaymentData {
  gig_id: string
  proposal_id: string
  client_id: string
  provider_id: string
  amount: number
  description?: string
}

export interface PaymentIntent {
  client_secret: string
  payment_intent_id: string
  payment_id: string
}

export class PaymentService {
  /**
   * Criar intenção de pagamento
   */
  static async createPaymentIntent(data: CreatePaymentData): Promise<{ data: PaymentIntent | null; error: any }> {
    try {
      console.log("💳 Criando intenção de pagamento:", data)

      // Calcular taxas
      const { data: gig } = await supabase
        .from("gigs")
        .select("category:categories(slug)")
        .eq("id", data.gig_id)
        .single()

      const categorySlug = gig?.category?.slug
      const platformFee = await this.calculatePlatformFee(data.amount, categorySlug)
      const providerAmount = data.amount - platformFee

      // Criar pagamento na base de dados
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          gig_id: data.gig_id,
          proposal_id: data.proposal_id,
          client_id: data.client_id,
          provider_id: data.provider_id,
          amount: data.amount,
          platform_fee: platformFee,
          provider_amount: providerAmount,
          status: "pending",
          description: data.description || `Pagamento para gig ${data.gig_id}`,
        })
        .select()
        .single()

      if (paymentError) {
        console.error("❌ Erro ao criar pagamento:", paymentError)
        return { data: null, error: paymentError }
      }

      // Criar Payment Intent no Stripe
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: payment.id,
          amount: data.amount,
          currency: "eur",
          metadata: {
            gig_id: data.gig_id,
            proposal_id: data.proposal_id,
            client_id: data.client_id,
            provider_id: data.provider_id,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { data: null, error }
      }

      const result = await response.json()

      // Atualizar pagamento com Stripe Payment Intent ID
      await supabase
        .from("payments")
        .update({ stripe_payment_intent_id: result.payment_intent_id })
        .eq("id", payment.id)

      return {
        data: {
          client_secret: result.client_secret,
          payment_intent_id: result.payment_intent_id,
          payment_id: payment.id,
        },
        error: null,
      }
    } catch (err) {
      console.error("❌ Erro ao criar intenção de pagamento:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Confirmar pagamento
   */
  static async confirmPayment(paymentIntentId: string): Promise<{ success: boolean; error?: any }> {
    try {
      console.log("✅ Confirmando pagamento:", paymentIntentId)

      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro ao confirmar pagamento:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Liberar pagamento do escrow
   */
  static async releaseEscrow(paymentId: string): Promise<{ success: boolean; error?: any }> {
    try {
      console.log("🔓 Liberando escrow:", paymentId)

      const response = await fetch("/api/payments/release-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro ao liberar escrow:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Solicitar reembolso
   */
  static async requestRefund(
    paymentId: string,
    reason: string,
    amount?: number,
  ): Promise<{ success: boolean; error?: any }> {
    try {
      console.log("💸 Solicitando reembolso:", paymentId)

      const response = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: paymentId,
          reason,
          amount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro ao solicitar reembolso:", err)
      return { success: false, error: err }
    }
  }

  /**
   * Buscar pagamentos do usuário
   */
  static async getUserPayments(userId: string): Promise<{ data: Payment[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          gig:gigs (
            title,
            category:categories(name, slug)
          ),
          proposal:proposals (
            message,
            price
          ),
          client:profiles!client_id (
            full_name,
            email,
            avatar_url
          ),
          provider:profiles!provider_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar pagamentos:", error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: [], error: err }
    }
  }

  /**
   * Buscar detalhes de um pagamento
   */
  static async getPaymentDetails(paymentId: string): Promise<{ data: Payment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          gig:gigs (
            title,
            description,
            category:categories(name, slug, color)
          ),
          proposal:proposals (
            message,
            price,
            delivery_time
          ),
          client:profiles!client_id (
            full_name,
            email,
            avatar_url
          ),
          provider:profiles!provider_id (
            full_name,
            email,
            avatar_url
          ),
          invoices (
            invoice_number,
            status,
            issue_date,
            due_date
          ),
          transactions (
            type,
            amount,
            status,
            description,
            created_at
          )
        `)
        .eq("id", paymentId)
        .single()

      if (error) {
        console.error("❌ Erro ao buscar detalhes do pagamento:", error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Buscar transações do usuário
   */
  static async getUserTransactions(userId: string): Promise<{ data: Transaction[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          payment:payments (
            gig:gigs (
              title
            )
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erro ao buscar transações:", error)
        return { data: [], error }
      }

      return { data: data || [], error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: [], error: err }
    }
  }

  /**
   * Gerar fatura
   */
  static async generateInvoice(paymentId: string): Promise<{ data: Invoice | null; error: any }> {
    try {
      console.log("📄 Gerando fatura para pagamento:", paymentId)

      const response = await fetch("/api/payments/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { data: null, error }
      }

      const result = await response.json()
      return { data: result.invoice, error: null }
    } catch (err) {
      console.error("❌ Erro ao gerar fatura:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Configurar conta Stripe Connect
   */
  static async setupStripeConnect(): Promise<{ account_link: string | null; error?: any }> {
    try {
      console.log("🔗 Configurando Stripe Connect")

      const response = await fetch("/api/payments/setup-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const error = await response.json()
        return { account_link: null, error }
      }

      const result = await response.json()
      return { account_link: result.account_link, error: null }
    } catch (err) {
      console.error("❌ Erro ao configurar Stripe Connect:", err)
      return { account_link: null, error: err }
    }
  }

  /**
   * Verificar status da conta Stripe
   */
  static async checkStripeAccountStatus(): Promise<{ status: string; error?: any }> {
    try {
      const response = await fetch("/api/payments/account-status")

      if (!response.ok) {
        const error = await response.json()
        return { status: "not_connected", error }
      }

      const result = await response.json()
      return { status: result.status, error: null }
    } catch (err) {
      console.error("❌ Erro ao verificar status da conta:", err)
      return { status: "error", error: err }
    }
  }

  /**
   * Calcular taxas da plataforma
   */
  static async calculatePlatformFee(amount: number, categorySlug?: string): Promise<number> {
    try {
      const { data } = await supabase.rpc("calculate_platform_fee", {
        amount,
        category_slug: categorySlug,
      })

      return data || amount * 0.05 // 5% padrão
    } catch (err) {
      console.error("❌ Erro ao calcular taxa:", err)
      return amount * 0.05 // 5% padrão
    }
  }

  /**
   * Formatar valor monetário
   */
  static formatCurrency(amount: number, currency = "EUR"): string {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency,
    }).format(amount)
  }

  /**
   * Obter status legível
   */
  static getStatusLabel(status: string): { label: string; color: string } {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "yellow" },
      processing: { label: "Processando", color: "blue" },
      succeeded: { label: "Pago", color: "green" },
      failed: { label: "Falhou", color: "red" },
      cancelled: { label: "Cancelado", color: "gray" },
      refunded: { label: "Reembolsado", color: "orange" },
      disputed: { label: "Disputado", color: "red" },
      escrowed: { label: "Em Escrow", color: "indigo" },
      released: { label: "Liberado", color: "green" },
    }

    return statusMap[status] || { label: status, color: "gray" }
  }

  /**
   * Buscar configurações de pagamento do usuário
   */
  static async getPaymentSettings(userId: string): Promise<{ data: PaymentSettings | null; error: any }> {
    try {
      const { data, error } = await supabase.from("payment_settings").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("❌ Erro ao buscar configurações:", error)
        return { data: null, error }
      }

      return { data: data || null, error: null }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { data: null, error: err }
    }
  }

  /**
   * Atualizar configurações de pagamento
   */
  static async updatePaymentSettings(
    userId: string,
    settings: Partial<PaymentSettings>,
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from("payment_settings")
        .upsert({
          user_id: userId,
          ...settings,
        })
        .eq("user_id", userId)

      if (error) {
        console.error("❌ Erro ao atualizar configurações:", error)
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      console.error("❌ Erro inesperado:", err)
      return { success: false, error: err }
    }
  }
}
