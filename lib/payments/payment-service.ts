"use client"

import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type Payment = Database["public"]["Tables"]["payments"]["Row"]
type Invoice = Database["public"]["Tables"]["invoices"]["Row"]
type Transaction = Database["public"]["Tables"]["transactions"]["Row"]

export interface CreatePaymentData {
  gig_id: string
  proposal_id: string
  client_id: string
  provider_id: string
  amount: number
  description: string
}

export interface PaymentIntent {
  client_secret: string
  payment_intent_id: string
}

export class PaymentService {
  /**
   * Criar intenção de pagamento
   */
  static async createPaymentIntent(data: CreatePaymentData): Promise<{ data: PaymentIntent | null; error: any }> {
    try {
      console.log("💳 Criando intenção de pagamento:", data.amount)

      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        return { data: null, error }
      }

      const result = await response.json()
      return { data: result, error: null }
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
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
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
            category
          ),
          proposal:gig_responses (
            proposal_title,
            proposed_price
          ),
          client:profiles!client_id (
            full_name,
            email
          ),
          provider:profiles!provider_id (
            full_name,
            email
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
            category
          ),
          proposal:gig_responses (
            proposal_title,
            proposal_description,
            proposed_price,
            timeline_days,
            deliverables
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
          invoice:invoices (
            invoice_number,
            status,
            issue_date,
            due_date
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
        headers: {
          "Content-Type": "application/json",
        },
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
   * Baixar fatura em PDF
   */
  static async downloadInvoicePDF(invoiceId: string): Promise<{ success: boolean; error?: any }> {
    try {
      console.log("📥 Baixando fatura PDF:", invoiceId)

      const response = await fetch(`/api/payments/invoice/${invoiceId}/pdf`)

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error }
      }

      // Criar download do PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fatura-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (err) {
      console.error("❌ Erro ao baixar fatura:", err)
      return { success: false, error: err }
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
        headers: {
          "Content-Type": "application/json",
        },
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
   * Calcular taxas
   */
  static calculateFees(amount: number, category?: string): { platformFee: number; providerAmount: number } {
    // Taxa padrão de 5%
    let feePercentage = 0.05

    // Taxas específicas por categoria (exemplo)
    const categoryFees: Record<string, number> = {
      tecnologia: 0.03,
      design: 0.04,
      marketing: 0.05,
      consultoria: 0.06,
    }

    if (category && categoryFees[category.toLowerCase()]) {
      feePercentage = categoryFees[category.toLowerCase()]
    }

    const platformFee = Math.round(amount * feePercentage * 100) / 100
    const providerAmount = Math.round((amount - platformFee) * 100) / 100

    return { platformFee, providerAmount }
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
}
