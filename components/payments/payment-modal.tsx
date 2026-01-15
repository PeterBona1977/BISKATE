"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { PaymentService } from "@/lib/payments/payment-service"
import { CreditCard, Shield, Euro, CheckCircle } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import type { Database } from "@/lib/supabase/database.types"

type GigResponse = Database["public"]["Tables"]["gig_responses"]["Row"]
type Gig = Database["public"]["Tables"]["gigs"]["Row"]

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentModalProps {
  proposal: GigResponse & {
    gig?: Gig
    profiles?: {
      full_name: string | null
      avatar_url: string | null
    }
  }
  onPaymentSuccess?: () => void
  trigger?: React.ReactNode
}

function PaymentForm({ proposal, onPaymentSuccess, onClose }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>("")
  const [paymentId, setPaymentId] = useState<string>("")

  useEffect(() => {
    if (proposal && user) {
      createPaymentIntent()
    }
  }, [proposal, user])

  const createPaymentIntent = async () => {
    if (!user || !proposal) return

    try {
      const { platformFee, providerAmount } = PaymentService.calculateFees(
        proposal.proposed_price,
        proposal.gig?.category,
      )

      const { data, error } = await PaymentService.createPaymentIntent({
        gig_id: proposal.gig_id,
        proposal_id: proposal.id,
        client_id: user.id,
        provider_id: proposal.responder_id,
        amount: proposal.proposed_price,
        description: `Pagamento para: ${proposal.proposal_title}`,
      })

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o pagamento",
          variant: "destructive",
        })
        return
      }

      setClientSecret(data.client_secret)
      setPaymentId(data.payment_id)
    } catch (err) {
      console.error("Erro ao criar intenção de pagamento:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar pagamento",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)

    try {
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        toast({
          title: "Erro",
          description: "Elemento do cartão não encontrado",
          variant: "destructive",
        })
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.user_metadata?.full_name || user?.email || "",
            email: user?.email || "",
          },
        },
      })

      if (error) {
        toast({
          title: "Erro no Pagamento",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (paymentIntent.status === "succeeded") {
        // Confirmar pagamento no backend
        const { success } = await PaymentService.confirmPayment(paymentIntent.id)

        if (success) {
          toast({
            title: "Pagamento Realizado!",
            description:
              "O pagamento foi processado com sucesso. O dinheiro ficará em escrow até a conclusão do trabalho.",
          })

          onPaymentSuccess?.()
          onClose?.()
        } else {
          toast({
            title: "Erro",
            description: "Erro ao confirmar pagamento",
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error("Erro no pagamento:", err)
      toast({
        title: "Erro",
        description: "Erro inesperado durante o pagamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const { platformFee, providerAmount } = PaymentService.calculateFees(proposal.proposed_price, proposal.gig?.category)

  return (
    <div className="space-y-6">
      {/* Resumo da Proposta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo da Proposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">{proposal.proposal_title}</h3>
            <p className="text-sm text-gray-600 mt-1">{proposal.proposal_description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Prestador:</span>
              <p className="font-medium">{proposal.profiles?.full_name || "Prestador"}</p>
            </div>
            <div>
              <span className="text-gray-500">Prazo:</span>
              <p className="font-medium">{proposal.timeline_days} dias</p>
            </div>
          </div>

          {proposal.deliverables && (
            <div>
              <span className="text-gray-500 text-sm">Entregáveis:</span>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                {(proposal.deliverables as string[]).map((deliverable, index) => (
                  <li key={index}>{deliverable}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes do Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Euro className="h-5 w-5 mr-2" />
            Detalhes do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Valor da Proposta:</span>
              <span className="font-medium">{PaymentService.formatCurrency(proposal.proposed_price)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Taxa da Plataforma ({((platformFee / proposal.proposed_price) * 100).toFixed(1)}%):</span>
              <span>-{PaymentService.formatCurrency(platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Valor para o Prestador:</span>
              <span>{PaymentService.formatCurrency(providerAmount)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total a Pagar:</span>
              <span className="text-green-600">{PaymentService.formatCurrency(proposal.proposed_price)}</span>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Pagamento Seguro:</strong> O dinheiro ficará em escrow (proteção) até que o trabalho seja
              concluído e aprovado por você.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Formulário de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Informações do Cartão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                  },
                }}
              />
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Seus dados de pagamento são processados de forma segura pelo Stripe. Não armazenamos informações do
                cartão.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!stripe || loading} className="min-w-[120px]">
                {loading ? "Processando..." : `Pagar ${PaymentService.formatCurrency(proposal.proposed_price)}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function PaymentModal({ proposal, onPaymentSuccess, trigger }: PaymentModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar Proposta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagamento Seguro</DialogTitle>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <PaymentForm proposal={proposal} onPaymentSuccess={onPaymentSuccess} onClose={() => setOpen(false)} />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}
