"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Shield, CheckCircle, Euro, Clock, Star, Loader2, Info } from "lucide-react"

interface GigData {
  title: string
  description: string
  category: string
  subcategory: string
  price: number
  deliveryTime: number
  location?: string
  requirements?: string
  tags: string[]
}

interface PaymentInfoModalProps {
  isOpen: boolean
  onClose: () => void
  gigData: GigData
  onPaymentSuccess: () => void
}

export function PaymentInfoModal({ isOpen, onClose, gigData, onPaymentSuccess }: PaymentInfoModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium">("basic")
  const [isProcessing, setIsProcessing] = useState(false)

  const platformFee = gigData.price * 0.05 // 5%
  const paymentProcessingFee = gigData.price * 0.029 + 0.3 // 2.9% + €0.30
  const totalFees = platformFee + paymentProcessingFee
  const netAmount = gigData.price - totalFees

  const premiumFee = selectedPlan === "premium" ? 9.99 : 0
  const totalCost = selectedPlan === "premium" ? premiumFee : 0

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      // Simular processamento de pagamento
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Aqui seria a integração com Stripe
      console.log("Processando pagamento:", {
        gigData,
        selectedPlan,
        totalCost,
      })

      onPaymentSuccess()
    } catch (error) {
      console.error("Erro no pagamento:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Finalizar Criação do Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo do Serviço */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{gigData.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{gigData.description.substring(0, 150)}...</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{gigData.category}</Badge>
                  <Badge variant="outline">{gigData.subcategory}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-green-600" />
                    <span>€{gigData.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>{gigData.deliveryTime} dias</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {gigData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Breakdown de Custos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breakdown de Custos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Preço do Serviço</span>
                  <span>€{gigData.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxa da Plataforma (5%)</span>
                  <span>-€{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxa de Processamento</span>
                  <span>-€{paymentProcessingFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Valor Líquido que Receberá</span>
                  <span>€{netAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Planos e Pagamento */}
          <div className="space-y-4">
            {/* Planos */}
            <div className="space-y-3">
              <h3 className="font-semibold">Escolha seu Plano</h3>

              {/* Plano Básico */}
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPlan === "basic" ? "ring-2 ring-blue-500 border-blue-500" : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedPlan("basic")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Básico</CardTitle>
                    <Badge variant="secondary">GRÁTIS</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Publicação do serviço
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Suporte básico
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Estatísticas básicas
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Plano Premium */}
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPlan === "premium" ? "ring-2 ring-purple-500 border-purple-500" : "hover:border-gray-300"
                }`}
                onClick={() => setSelectedPlan("premium")}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      Premium
                      <Star className="h-4 w-4 text-yellow-500" />
                    </CardTitle>
                    <Badge variant="default">€9.99</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Destaque na pesquisa
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Estatísticas avançadas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Suporte prioritário
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Badge "Premium"
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Total a Pagar */}
            {selectedPlan === "premium" && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total a Pagar</span>
                    <span className="text-xl font-bold text-purple-600">€{totalCost.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações de Segurança */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Pagamento Seguro:</strong> Processado via Stripe com criptografia SSL. Seus dados estão
                protegidos.
              </AlertDescription>
            </Alert>

            {/* Processo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                    1
                  </div>
                  <span>Seu serviço é publicado na plataforma</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                    2
                  </div>
                  <span>Clientes fazem pedidos e pagam antecipadamente</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                    3
                  </div>
                  <span>Você entrega o trabalho conforme acordado</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                    4
                  </div>
                  <span>Recebe o pagamento após aprovação do cliente</span>
                </div>
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isProcessing}>
                Cancelar
              </Button>
              <Button onClick={handlePayment} className="flex-1" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : selectedPlan === "basic" ? (
                  "Publicar Grátis"
                ) : (
                  "Pagar e Publicar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentInfoModal
